import { writeFileSync } from "fs";

// SVG를 기반으로 간단한 PNG placeholder 생성
// 실제 배포 시에는 디자이너가 만든 아이콘으로 교체

const sizes = [192, 512];

for (const size of sizes) {
  // 1x1 빨간색 PNG placeholder (실제로는 SVG 아이콘을 사용)
  // sharp 패키지가 있으면 SVG→PNG 변환 가능
  console.log(`icon-${size}.png: SVG 아이콘을 사용합니다 (/icons/icon.svg)`);
}

console.log("\n참고: PWA 아이콘은 /public/icons/icon.svg를 직접 사용합니다.");
console.log("프로덕션 배포 시 192x192, 512x512 PNG 파일을 추가하세요.");
