const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  console.log('1. 메인 페이지 (히어로 섹션)...');
  await page.goto('http://localhost:3000');
  await page.waitForSelector('#hero', { timeout: 10000 });
  await page.waitForTimeout(2000); // 애니메이션 완료 대기
  await page.screenshot({ path: 'screenshots/01-hero.png', fullPage: false });
  console.log('   ✓ 히어로 섹션 스크린샷 완료');

  console.log('2. 원두 목록 섹션...');
  await page.locator('#beans').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'screenshots/02-beans-list.png', fullPage: false });
  console.log('   ✓ 원두 목록 스크린샷 완료');

  console.log('3. 로스팅 필터 테스트 (라이트)...');
  await page.click('button:text("라이트")');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'screenshots/03-filter-light.png', fullPage: false });
  const lightCards = await page.locator('.card-hover').count();
  console.log(`   ✓ 라이트 필터 적용: ${lightCards}개 원두 표시`);

  console.log('4. 필터 초기화 (전체 보기)...');
  await page.click('button:text("전체 보기")');
  await page.waitForTimeout(500);
  const allCards = await page.locator('.card-hover').count();
  console.log(`   ✓ 전체 보기: ${allCards}개 원두 표시`);

  console.log('5. 가격 정렬 테스트 (낮은순)...');
  await page.selectOption('select', 'price-asc');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'screenshots/04-sort-price-asc.png', fullPage: false });
  console.log('   ✓ 가격 낮은순 정렬 스크린샷 완료');

  console.log('6. 원두 상세 모달...');
  await page.selectOption('select', 'default'); // 정렬 초기화
  await page.waitForTimeout(300);
  await page.locator('.card-hover').first().click();
  await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'screenshots/05-bean-detail-modal.png', fullPage: false });
  console.log('   ✓ 원두 상세 모달 스크린샷 완료');

  console.log('7. 모달에서 장바구니 담기...');
  await page.click('[role="dialog"] button:text("장바구니에 담기")');
  await page.waitForTimeout(500);
  // 모달이 닫혀야 함
  const modalClosed = await page.locator('[role="dialog"]').count() === 0;
  console.log(`   ✓ 모달 닫힘: ${modalClosed}`);

  console.log('8. 카드에서 직접 담기 버튼...');
  await page.locator('#beans').scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  // 두 번째 원두 "담기" 클릭
  await page.locator('.card-hover').nth(1).locator('button:text("담기")').click();
  await page.waitForTimeout(500);
  // 세 번째 원두도 담기
  await page.locator('.card-hover').nth(2).locator('button:text("담기")').click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'screenshots/06-items-added.png', fullPage: false });
  console.log('   ✓ 원두 3개 장바구니 담기 완료');

  console.log('9. 장바구니 열기...');
  // 데스크톱 네비 장바구니 클릭
  await page.locator('nav button:text("장바구니")').click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'screenshots/07-cart-drawer.png', fullPage: false });
  console.log('   ✓ 장바구니 드로어 스크린샷 완료');

  console.log('10. 장바구니 수량 변경...');
  // + 버튼 클릭하여 수량 증가
  await page.locator('.fixed button:text("+")').first().click();
  await page.waitForTimeout(300);
  await page.locator('.fixed button:text("+")').first().click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'screenshots/08-cart-quantity.png', fullPage: false });
  console.log('   ✓ 수량 변경 스크린샷 완료');

  console.log('11. 주문하기 (체크아웃 페이지)...');
  await page.locator('button:text("주문하기")').click();
  await page.waitForTimeout(3000); // 토스 위젯 로딩 대기
  await page.screenshot({ path: 'screenshots/09-checkout.png', fullPage: false });
  console.log('   ✓ 체크아웃 페이지 스크린샷 완료');

  console.log('12. 결제 실패 페이지...');
  await page.goto('http://localhost:3000#/payments/fail?code=TEST_ERROR&message=테스트 결제 실패');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'screenshots/10-payment-fail.png', fullPage: false });
  console.log('   ✓ 결제 실패 페이지 스크린샷 완료');

  console.log('13. 풀 페이지 스크린샷...');
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshots/11-fullpage.png', fullPage: true });
  console.log('   ✓ 풀 페이지 스크린샷 완료');

  console.log('14. 푸터 확인...');
  await page.locator('footer').scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'screenshots/12-footer.png', fullPage: false });
  console.log('   ✓ 푸터 스크린샷 완료');

  await browser.close();
  console.log('\n========================================');
  console.log('모든 테스트 완료! screenshots/ 폴더를 확인하세요.');
  console.log('========================================');
})();
