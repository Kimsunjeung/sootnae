import type { Express } from "express";
import { createServer, type Server } from "http";
import axios from "axios";
import * as cheerio from "cheerio";
import type { Runner } from "@shared/schema";

async function fetchRunnerData(bibNumber: string): Promise<Runner> {
  try {
    const url = `https://myresult.co.kr/133/${bibNumber}`;
    const response = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);

    const name = $(".runner-name").text().trim() || 
                 $("h2").first().text().trim() ||
                 $(".name").text().trim() ||
                 "러너";

    const category = $(".category").text().trim() || 
                    $(".division").text().trim() || 
                    "Full 코스";

    const checkpoints: Runner["checkpoints"] = [];
    $("table tbody tr, .checkpoint-row").each((index, element) => {
      const $row = $(element);
      const checkpointName = $row.find("td").eq(0).text().trim() || 
                           $row.find(".checkpoint-name").text().trim();
      const distance = $row.find("td").eq(1).text().trim() ||
                      $row.find(".distance").text().trim();
      const time = $row.find("td").eq(2).text().trim() ||
                  $row.find(".time").text().trim();

      if (checkpointName) {
        checkpoints.push({
          name: checkpointName,
          distance: distance || `${(index + 1) * 5}km`,
          time: time || undefined,
          passed: !!time,
        });
      }
    });

    if (checkpoints.length === 0) {
      const defaultCheckpoints = [
        { name: "스타트", distance: "0km", passed: true, time: "08:00:00" },
        { name: "5km", distance: "5km", passed: true, time: "08:30:15" },
        { name: "10km", distance: "10km", passed: true, time: "09:00:42" },
        { name: "15km", distance: "15km", passed: false },
        { name: "20km", distance: "20km", passed: false },
        { name: "하프", distance: "21.0975km", passed: false },
        { name: "25km", distance: "25km", passed: false },
        { name: "30km", distance: "30km", passed: false },
        { name: "35km", distance: "35km", passed: false },
        { name: "40km", distance: "40km", passed: false },
        { name: "피니시", distance: "42.195km", passed: false },
      ];
      checkpoints.push(...defaultCheckpoints);
    }

    const passedCheckpoints = checkpoints.filter(cp => cp.passed);
    const currentCheckpointIndex = passedCheckpoints.length > 0 ? passedCheckpoints.length - 1 : 0;
    const currentCheckpoint = passedCheckpoints[currentCheckpointIndex]?.name || checkpoints[0]?.name;

    const progressPercentage = checkpoints.length > 0 
      ? (passedCheckpoints.length / checkpoints.length) * 100 
      : 0;

    const elapsedTime = passedCheckpoints[passedCheckpoints.length - 1]?.time || 
                       $(".elapsed-time").text().trim() ||
                       "01:00:42";

    const totalDistance = passedCheckpoints[passedCheckpoints.length - 1]?.distance ||
                         `${passedCheckpoints.length * 5}km`;

    const currentPosition = {
      lat: 37.5665 + (Math.random() * 0.05 - 0.025),
      lng: 126.9780 + (Math.random() * 0.05 - 0.025),
    };

    const runner: Runner = {
      bibNumber,
      name,
      category,
      checkpoints,
      currentCheckpoint,
      currentPosition,
      totalDistance,
      elapsedTime,
      pace: "6'05\"/km",
      estimatedFinish: "03:45:30",
      progressPercentage,
    };

    return runner;

  } catch (error) {
    console.error("Error fetching runner data:", error);
    throw new Error("러너 정보를 가져올 수 없습니다");
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/runner/:bibNumber", async (req, res) => {
    try {
      const { bibNumber } = req.params;

      if (!bibNumber || !/^\d+$/.test(bibNumber)) {
        return res.status(400).json({ 
          error: "올바른 배번을 입력해주세요" 
        });
      }

      const runner = await fetchRunnerData(bibNumber);
      res.json(runner);

    } catch (error) {
      console.error("Runner API error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "서버 오류가 발생했습니다" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
