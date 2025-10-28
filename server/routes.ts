import type { Express } from "express";
import { createServer, type Server } from "http";
import * as cheerio from "cheerio";
import puppeteer from "puppeteer";
import { exec } from "child_process";
import { promisify } from "util";
import type { Runner } from "@shared/schema";

const execAsync = promisify(exec);

// Seoul Marathon course approximate coordinates
const SEOUL_COURSE_CHECKPOINTS = [
  { name: "스타트", distance: "0km", distanceKm: 0, lat: 37.5172, lng: 127.0473 },
  { name: "5km", distance: "5km", distanceKm: 5, lat: 37.5239, lng: 127.0369 },
  { name: "10km", distance: "10km", distanceKm: 10, lat: 37.5311, lng: 127.0247 },
  { name: "15km", distance: "15km", distanceKm: 15, lat: 37.5447, lng: 127.0561 },
  { name: "20km", distance: "20km", distanceKm: 20, lat: 37.5576, lng: 127.0016 },
  { name: "하프", distance: "21.0975km", distanceKm: 21.0975, lat: 37.5601, lng: 126.9946 },
  { name: "25km", distance: "25km", distanceKm: 25, lat: 37.5738, lng: 126.9769 },
  { name: "30km", distance: "30km", distanceKm: 30, lat: 37.5665, lng: 126.9920 },
  { name: "35km", distance: "35km", distanceKm: 35, lat: 37.5512, lng: 127.0101 },
  { name: "40km", distance: "40km", distanceKm: 40, lat: 37.5290, lng: 127.0344 },
  { name: "피니시", distance: "42.195km", distanceKm: 42.195, lat: 37.5172, lng: 127.0473 },
];

function parseDistance(distanceStr: string): number | null {
  if (!distanceStr) return null;
  const match = distanceStr.match(/([\d.]+)\s*km/i);
  return match ? parseFloat(match[1]) : null;
}

function parseTime(timeStr: string): number | null {
  if (!timeStr || timeStr === '-' || timeStr.trim() === '') return null;
  
  const parts = timeStr.split(':');
  if (parts.length === 3) {
    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);
    const seconds = parseInt(parts[2]);
    if (!isNaN(hours) && !isNaN(minutes) && !isNaN(seconds)) {
      return hours * 60 + minutes + seconds / 60;
    }
  }
  return null;
}

function calculatePositionFromProgress(totalDistanceKm: number): { lat: number; lng: number } {
  for (let i = 0; i < SEOUL_COURSE_CHECKPOINTS.length - 1; i++) {
    const current = SEOUL_COURSE_CHECKPOINTS[i];
    const next = SEOUL_COURSE_CHECKPOINTS[i + 1];
    
    if (totalDistanceKm >= current.distanceKm && totalDistanceKm <= next.distanceKm) {
      const segmentDistance = next.distanceKm - current.distanceKm;
      const progress = (totalDistanceKm - current.distanceKm) / segmentDistance;
      
      return {
        lat: current.lat + (next.lat - current.lat) * progress,
        lng: current.lng + (next.lng - current.lng) * progress,
      };
    }
  }
  
  const lastCheckpoint = SEOUL_COURSE_CHECKPOINTS[SEOUL_COURSE_CHECKPOINTS.length - 1];
  return { lat: lastCheckpoint.lat, lng: lastCheckpoint.lng };
}

function calculatePace(checkpoints: Array<{ distance: string; time?: string; passed: boolean }>): string | null {
  const validCheckpoints = checkpoints.filter(cp => cp.passed && cp.time);
  
  if (validCheckpoints.length < 2) return null;
  
  const last = validCheckpoints[validCheckpoints.length - 1];
  const prev = validCheckpoints[validCheckpoints.length - 2];
  
  const lastDist = parseDistance(last.distance);
  const prevDist = parseDistance(prev.distance);
  const lastTime = parseTime(last.time!);
  const prevTime = parseTime(prev.time!);
  
  if (!lastDist || !prevDist || !lastTime || !prevTime) return null;
  
  const distDiff = lastDist - prevDist;
  const timeDiff = lastTime - prevTime;
  
  if (distDiff <= 0 || timeDiff <= 0) return null;
  
  const pacePerKm = timeDiff / distDiff;
  const minutes = Math.floor(pacePerKm);
  const seconds = Math.floor((pacePerKm - minutes) * 60);
  
  return `${minutes}'${String(seconds).padStart(2, '0')}"/km`;
}

async function fetchRunnerData(bibNumber: string): Promise<Runner> {
  let browser;
  try {
    // 2025 JTBC Marathon (race #133) - data will be available on race day (Nov 2, 2025)
    const url = `https://myresult.co.kr/133/${bibNumber}`;
    
    // Find system Chromium path (Replit-specific)
    let chromiumPath = '';
    try {
      const { stdout } = await execAsync('which chromium');
      chromiumPath = stdout.trim();
    } catch (err) {
      // Will use default Chromium path
    }
    
    // Launch Puppeteer to handle JavaScript rendering
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      executablePath: chromiumPath || undefined, // Use system Chromium if found
    });
    
    const page = await browser.newPage();
    
    // Set user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Navigate to the page
    const response = await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });
    
    if (!response || response.status() === 404) {
      throw new Error("해당 배번의 러너 정보를 찾을 수 없습니다");
    }
    
    // Wait for the table to appear (Nuxt app renders asynchronously)
    try {
      await page.waitForSelector('table', { timeout: 10000 });
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (err) {
      // Continue even if table not found
    }
    
    // Get the rendered HTML
    const html = await page.content();
    await browser.close();
    browser = undefined;
    
    const $ = cheerio.load(html);

    // Extract runner name - improved parsing
    let name = "";
    
    // Look for name in specific HTML structure
    $("h2, h3, .name, .runner-name").each((_, el) => {
      const text = $(el).text().trim();
      // Korean name pattern: 2-5 characters
      if (text && /^[가-힣]{2,5}$/.test(text)) {
        name = text;
        return false; // break
      }
    });

    if (!name) {
      // Fallback: look in table cells
      $("td, th").each((_, el) => {
        const text = $(el).text().trim();
        if (text && /^[가-힣]{2,5}$/.test(text) && !text.includes("남자") && !text.includes("여자")) {
          name = text;
          return false;
        }
      });
    }

    // Name will be empty if not found

    // Extract category/division - improved parsing
    let category = "";
    
    // Look for "Full", "10K", "Half" etc.
    $("h2, h3, .category, .course").each((_, el) => {
      const text = $(el).text().trim();
      if (text && (text === "Full" || text === "10K" || text.includes("풀") || text.includes("하프"))) {
        category = text;
        return false;
      }
    });

    if (!category) {
      category = "Full";
    }

    // Extract checkpoints from table - improved for 4-column structure
    // Format: 구간명 | 통과시간 | 구간기록 | 누적기록
    const checkpoints: Runner["checkpoints"] = [];
    let foundValidCheckpoints = false;

    $("table").each((_, table) => {
      const $table = $(table);
      const rows = $table.find("tbody tr, tr");
      
      rows.each((_, row) => {
        const $row = $(row);
        const cells = $row.find("td");
        
        // Skip header rows
        if ($row.find("th").length > 0) return;
        
        // We expect 4 columns: 구간명, 통과시간, 구간기록, 누적기록
        if (cells.length >= 4) {
          const checkpointName = cells.eq(0).text().trim(); // 구간명
          const passedTime = cells.eq(1).text().trim();     // 통과시간 (실제 시계 시간)
          const lapTime = cells.eq(2).text().trim();        // 구간기록
          const cumulativeTime = cells.eq(3).text().trim(); // 누적기록
          
          // Check if this looks like a checkpoint row
          // Valid checkpoint names: "출발", "5K", "10K", "15K", "20K", "하프", "25K", "30K", "35K", "40K", "도착"
          const isCheckpoint = checkpointName === "출발" || 
                              checkpointName === "도착" || 
                              checkpointName.includes("K") || 
                              checkpointName.includes("하프") ||
                              checkpointName.match(/\d+\s*km/i);
          
          if (isCheckpoint) {
            // Use cumulative time (누적기록) as the time value
            // Skip if it's "-" or empty
            const hasTime = cumulativeTime && cumulativeTime !== "-" && cumulativeTime.match(/\d+:\d+:\d+/);
            
            // Convert checkpoint name to distance format
            let distance = "0km";
            if (checkpointName.includes("5K") || checkpointName === "5K") distance = "5km";
            else if (checkpointName.includes("10K") || checkpointName === "10K") distance = "10km";
            else if (checkpointName.includes("15K") || checkpointName === "15K") distance = "15km";
            else if (checkpointName.includes("20K") || checkpointName === "20K") distance = "20km";
            else if (checkpointName.includes("하프") || checkpointName === "하프") distance = "21.0975km";
            else if (checkpointName.includes("25K") || checkpointName === "25K") distance = "25km";
            else if (checkpointName.includes("30K") || checkpointName === "30K") distance = "30km";
            else if (checkpointName.includes("35K") || checkpointName === "35K") distance = "35km";
            else if (checkpointName.includes("40K") || checkpointName === "40K") distance = "40km";
            else if (checkpointName === "도착") distance = "42.195km";
            
            checkpoints.push({
              name: checkpointName,
              distance: distance,
              time: hasTime ? cumulativeTime : undefined,
              passed: !!hasTime,
            });
            
            if (hasTime) {
              foundValidCheckpoints = true;
            }
          }
        }
      });
    });

    // If we didn't find any valid data, throw an error
    if (!foundValidCheckpoints || checkpoints.length === 0) {
      console.error("Failed to parse checkpoint data from HTML");
      throw new Error("러너 정보를 파싱할 수 없습니다. 배번을 확인하거나 나중에 다시 시도해주세요.");
    }

    const passedCheckpoints = checkpoints.filter(cp => cp.passed);
    
    if (passedCheckpoints.length === 0) {
      throw new Error("아직 체크포인트 기록이 없습니다");
    }

    const lastPassed = passedCheckpoints[passedCheckpoints.length - 1];
    const lastDistance = parseDistance(lastPassed.distance);
    
    if (!lastDistance) {
      throw new Error("거리 정보를 파싱할 수 없습니다");
    }

    const currentPosition = calculatePositionFromProgress(lastDistance);
    const pace = calculatePace(checkpoints);
    
    const currentCheckpoint = lastPassed.name;
    const progressPercentage = (passedCheckpoints.length / checkpoints.length) * 100;
    const elapsedTime = lastPassed.time || "기록 없음";
    const totalDistance = lastPassed.distance;

    let estimatedFinish = "계산중";
    if (pace && lastDistance < 42.195) {
      const paceMatch = pace.match(/(\d+)'(\d+)"/);
      if (paceMatch) {
        const paceMinutes = parseInt(paceMatch[1]) + parseInt(paceMatch[2]) / 60;
        const remainingKm = 42.195 - lastDistance;
        const lastTime = parseTime(lastPassed.time!);
        
        if (lastTime) {
          const totalEstimatedMinutes = lastTime + (remainingKm * paceMinutes);
          const hours = Math.floor(totalEstimatedMinutes / 60);
          const mins = Math.floor(totalEstimatedMinutes % 60);
          estimatedFinish = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:00`;
        }
      }
    }

    const runner: Runner = {
      bibNumber,
      name: name || `러너 #${bibNumber}`,
      category: category || "Full 코스",
      checkpoints,
      currentCheckpoint,
      currentPosition,
      totalDistance,
      elapsedTime,
      pace: pace || "계산중",
      estimatedFinish,
      progressPercentage,
    };

    return runner;

  } catch (error) {
    console.error("Error in fetchRunnerData:", error);
    
    if (error instanceof Error) {
      if (error.message.includes("러너") || error.message.includes("파싱") || error.message.includes("찾을 수 없습니다")) {
        throw error;
      }
      
      if (error.message.includes("timeout") || error.message.includes("TimeoutError")) {
        throw new Error("서버 응답 시간이 초과되었습니다. 다시 시도해주세요.");
      }
    }
    
    throw new Error("러너 정보를 가져올 수 없습니다. 잠시 후 다시 시도해주세요.");
  } finally {
    // Ensure browser is closed
    if (browser) {
      try {
        await browser.close();
      } catch (err) {
        console.error("Error closing browser:", err);
      }
    }
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/runner/:bibNumber", async (req, res) => {
    try {
      const { bibNumber } = req.params;

      if (!bibNumber || !/^\d+$/.test(bibNumber)) {
        return res.status(400).json({ 
          error: "올바른 배번을 입력해주세요 (숫자만 입력 가능)" 
        });
      }

      const runner = await fetchRunnerData(bibNumber);
      res.json(runner);

    } catch (error) {
      console.error("Runner API error:", error);
      
      const statusCode = error instanceof Error && error.message.includes("찾을 수 없습니다") ? 404 : 500;
      
      res.status(statusCode).json({ 
        error: error instanceof Error ? error.message : "서버 오류가 발생했습니다" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
