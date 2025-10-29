export interface CourseCheckpoint {
  name: string;
  distance: string; // label e.g., "5km"
  distanceKm: number;
  lat: number;
  lng: number;
}

export type LatLng = { lat: number; lng: number };

// 서울 마라톤(예시) 코스 체크포인트를 공용으로 사용
export const SEOUL_COURSE_CHECKPOINTS: CourseCheckpoint[] = [
  // Start: Sangam World Cup Park
  { name: "스타트(상암월드컵공원)", distance: "0km", distanceKm: 0, lat: 37.5683, lng: 126.8970 },
  // Gwanghwamun/Sejong-daero 중간 체크
  { name: "광화문 세종대로", distance: "~12km", distanceKm: 12, lat: 37.5720, lng: 126.9769 },
  // Sinseol-dong
  { name: "신설동역", distance: "~16km", distanceKm: 16, lat: 37.5753, lng: 127.0250 },
  // Gunja x-road
  { name: "군자역 사거리", distance: "~20km", distanceKm: 20, lat: 37.5551, lng: 127.0813 },
  // Hangnyeoul
  { name: "학여울역", distance: "~30km", distanceKm: 30, lat: 37.4967, lng: 127.0709 },
  // Suseo IC
  { name: "수서IC", distance: "~34km", distanceKm: 34, lat: 37.4833, lng: 127.0930 },
  // Finish: Olympic Park
  { name: "피니시(올림픽공원)", distance: "42.195km", distanceKm: 42.195, lat: 37.5152, lng: 127.1213 },
];

// 실제 코스에 더 근접한 경로(대략치). A: 상암→광화문→군자, B: 군자→수서IC→올림픽공원
export const SEOUL_FULL_COURSE_PATH_A: LatLng[] = [
  // Sangam area
  { lat: 37.5683, lng: 126.8970 },
  { lat: 37.5664, lng: 126.9025 },
  { lat: 37.5610, lng: 126.9083 },
  { lat: 37.5535, lng: 126.9135 },
  // Yeouido northbank approach
  { lat: 37.5442, lng: 126.9208 },
  { lat: 37.5348, lng: 126.9282 },
  { lat: 37.5285, lng: 126.9349 }, // 여의도 공원 북서측
  // Mapo/Gongdeok
  { lat: 37.5418, lng: 126.9499 }, // 공덕역 인근
  { lat: 37.5513, lng: 126.9606 },
  { lat: 37.5595, lng: 126.9690 },
  // Gwanghwamun/Sejong-daero
  { lat: 37.5694, lng: 126.9749 },
  { lat: 37.5720, lng: 126.9769 },
  { lat: 37.5723, lng: 126.9838 },
  { lat: 37.5729, lng: 126.9915 },
  { lat: 37.5737, lng: 127.0010 },
  { lat: 37.5745, lng: 127.0110 },
  { lat: 37.5753, lng: 127.0250 }, // 신설동
  { lat: 37.5714, lng: 127.0400 },
  { lat: 37.5656, lng: 127.0510 },
  { lat: 37.5580, lng: 127.0650 },
  { lat: 37.5551, lng: 127.0813 }, // 군자 사거리
];

export const SEOUL_FULL_COURSE_PATH_B: LatLng[] = [
  // 군자 → 동쪽/남쪽 경유 → 송파/수서 → 올림픽공원
  { lat: 37.5490, lng: 127.0945 },
  { lat: 37.5438, lng: 127.1010 },
  { lat: 37.5382, lng: 127.1075 },
  { lat: 37.5324, lng: 127.1120 },
  { lat: 37.5250, lng: 127.1145 },
  { lat: 37.5188, lng: 127.1129 }, // 잠실북측 접근
  { lat: 37.5098, lng: 127.1040 },
  { lat: 37.5018, lng: 127.0908 },
  { lat: 37.4967, lng: 127.0709 }, // 학여울
  { lat: 37.4902, lng: 127.0799 },
  { lat: 37.4851, lng: 127.0895 },
  { lat: 37.4833, lng: 127.0930 }, // 수서IC
  { lat: 37.4869, lng: 127.1049 },
  { lat: 37.4925, lng: 127.1160 },
  { lat: 37.5002, lng: 127.1248 },
  { lat: 37.5075, lng: 127.1298 },
  { lat: 37.5131, lng: 127.1315 },
  { lat: 37.5168, lng: 127.1279 },
  { lat: 37.5152, lng: 127.1213 }, // 올림픽공원 피니시
];

