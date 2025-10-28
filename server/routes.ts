import type { Express } from "express";
import { createServer, type Server } from "http";
import axios from "axios";
import * as cheerio from "cheerio";
import type { Runner } from "@shared/schema";

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
  try {
    const url = `https://myresult.co.kr/133/${bibNumber}`;
    
    console.log(`Fetching runner data from: ${url}`);
    
    const response = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
      },
      timeout: 15000,
      validateStatus: (status) => status < 500,
    });

    if (response.status === 404) {
      throw new Error("해당 배번의 러너 정보를 찾을 수 없습니다");
    }

    const $ = cheerio.load(response.data);
    
    console.log("HTML page title:", $("title").text());
    console.log("HTML body length:", response.data.length);

    // Try to extract runner name
    let name = "";
    const nameSelectors = [
      ".runner-name",
      ".name",
      "h2.name",
      ".player-name",
      ".athlete-name",
      'td:contains("성명") + td',
      'td:contains("이름") + td',
      'th:contains("성명") + td',
      'th:contains("이름") + td',
    ];

    for (const selector of nameSelectors) {
      const text = $(selector).first().text().trim();
      if (text && text.length >= 2 && text.length <= 10) {
        name = text;
        break;
      }
    }

    if (!name) {
      console.log("Could not find runner name in standard locations");
    }

    // Try to extract category/division
    let category = "";
    const categorySelectors = [
      ".category",
      ".division",
      ".course",
      'td:contains("코스") + td',
      'td:contains("종목") + td',
      'th:contains("코스") + td',
    ];

    for (const selector of categorySelectors) {
      const text = $(selector).first().text().trim();
      if (text) {
        category = text;
        break;
      }
    }

    // Try to extract checkpoints from table
    const checkpoints: Runner["checkpoints"] = [];
    let foundValidCheckpoints = false;

    $("table").each((_, table) => {
      const $table = $(table);
      $table.find("tbody tr, tr").each((_, row) => {
        const $row = $(row);
        const cells = $row.find("td");
        
        if (cells.length >= 2) {
          const col0 = cells.eq(0).text().trim();
          const col1 = cells.eq(1).text().trim();
          const col2 = cells.length >= 3 ? cells.eq(2).text().trim() : "";
          
          // Check if this looks like a checkpoint row
          const distMatch = col0.match(/\d+\s*km/i) || col1.match(/\d+\s*km/i);
          
          if (distMatch) {
            const checkpointName = col0.includes('km') ? col0 : (col1.includes('km') ? col1 : col0);
            const distance = distMatch[0];
            const time = col2 && col2.match(/\d+:\d+:\d+/) ? col2 : undefined;
            
            checkpoints.push({
              name: checkpointName,
              distance: distance,
              time: time,
              passed: !!time,
            });
            
            if (time) foundValidCheckpoints = true;
          }
        }
      });
    });

    console.log(`Found ${checkpoints.length} checkpoints, ${foundValidCheckpoints ? 'with' : 'without'} valid timing data`);

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
    
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        throw new Error("해당 배번의 러너 정보를 찾을 수 없습니다");
      } else if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        throw new Error("서버 응답 시간이 초과되었습니다. 다시 시도해주세요.");
      } else if (error.response?.status && error.response.status >= 500) {
        throw new Error("myresult.co.kr 서버에 일시적인 문제가 있습니다");
      }
    }
    
    if (error instanceof Error && error.message.includes("러너") || error instanceof Error && error.message.includes("파싱")) {
      throw error;
    }
    
    throw new Error("러너 정보를 가져올 수 없습니다. 잠시 후 다시 시도해주세요.");
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
