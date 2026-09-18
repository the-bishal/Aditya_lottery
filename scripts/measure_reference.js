import { Jimp } from 'jimp';

async function measure() {
  const eve = await Jimp.read('/Users/guptabishal111gmail.com/.gemini/antigravity-ide/brain/20e46f9f-232f-49d3-9c2b-49e949fbe6a7/.user_uploaded/media_1789725638891.jpg');
  const mor = await Jimp.read('/Users/guptabishal111gmail.com/.gemini/antigravity-ide/brain/20e46f9f-232f-49d3-9c2b-49e949fbe6a7/.user_uploaded/media_1789724720241.jpg');

  console.log('=== Measuring Reference Images ===');

  function findTextBBox(img, x1, x2, y1, y2, condition) {
    let minX = 9999, maxX = 0, minY = 9999, maxY = 0, count = 0;
    for (let y = y1; y <= y2; y++) {
      for (let x = x1; x <= x2; x++) {
        const hex = img.getPixelColor(x, y);
        const r = (hex >> 24) & 0xff;
        const g = (hex >> 16) & 0xff;
        const b = (hex >> 8) & 0xff;
        if (condition(r, g, b)) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          count++;
        }
      }
    }
    return { minX, maxX, width: maxX - minX + 1, minY, maxY, height: maxY - minY + 1, cx: (minX + maxX)/2, cy: (minY + maxY)/2, count };
  }

  // 1. Draw No in Eve (check dark or red)
  console.log('Eve Draw No (red):', findTextBBox(eve, 480, 570, 135, 180, (r, g, b) => r > 140 && g < 80 && b < 80));
  console.log('Mor Draw No (red):', findTextBBox(mor, 500, 560, 135, 180, (r, g, b) => r > 140 && g < 80 && b < 80));

  // 2. Draw Date in Eve (white in blue pill)
  console.log('Eve Draw Date pill bounds (white text):', findTextBBox(eve, 580, 715, 135, 180, (r, g, b) => r > 210 && g > 210 && b > 210));
  console.log('Mor Draw Date pill bounds (white text):', findTextBBox(mor, 580, 715, 135, 180, (r, g, b) => r > 210 && g > 210 && b > 210));

  // 3. 1st Prize Ticket
  console.log('Eve 1st Prize ticket:', findTextBBox(eve, 400, 680, 185, 255, (r, g, b) => r > 160 && g < 60 && b < 60));
  console.log('Mor 1st Prize ticket:', findTextBBox(mor, 400, 680, 185, 255, (r, g, b) => r > 160 && g < 60 && b < 60));

  // 4. Consolation Prize Number
  console.log('Eve Cons Number (after Seller ₹500/-):', findTextBBox(eve, 555, 650, 245, 275, (r, g, b) => (r*0.299 + g*0.587 + b*0.114) < 90));
  console.log('Mor Cons Number (after Seller ₹500/-):', findTextBBox(mor, 555, 650, 245, 275, (r, g, b) => (r*0.299 + g*0.587 + b*0.114) < 90));

  // 5. 5th Prize Table measurements
  // Find grid lines or cell bounds
  // 5th prize header ends around y=770..780
  console.log('Eve 5th prize row 1 (y=775..795):', findTextBBox(eve, 10, 745, 775, 795, (r, g, b) => (r*0.299 + g*0.587 + b*0.114) < 90));
  console.log('Eve 5th prize row 10 (y=935..965):', findTextBBox(eve, 10, 745, 935, 965, (r, g, b) => (r*0.299 + g*0.587 + b*0.114) < 90));

  // Measure all 10 column centers for 5th prize
  // Col 0..9 across x=15..740
  const row1Y1 = 775, row1Y2 = 795;
  const colCenters = [];
  for (let c = 0; c < 10; c++) {
    const approxX = 18 + c * 72.8;
    const box = findTextBBox(eve, approxX - 10, approxX + 55, row1Y1, row1Y2, (r, g, b) => (r*0.299 + g*0.587 + b*0.114) < 90);
    colCenters.push(box);
  }
  console.log('5th Prize 10 Column Centers (Row 1):', colCenters.map((b, i) => ({ col: i, cx: b.cx, width: b.width, height: b.height })));

  // Measure all 10 row centers for 5th prize (Column 0, x=15..65)
  const rowCenters = [];
  for (let r = 0; r < 10; r++) {
    const approxY = 775 + r * 18;
    const box = findTextBBox(eve, 15, 65, approxY - 3, approxY + 20, (r, g, b) => (r*0.299 + g*0.587 + b*0.114) < 90);
    rowCenters.push(box);
  }
  console.log('5th Prize 10 Row Centers (Col 0):', rowCenters.map((b, i) => ({ row: i, cy: b.cy, height: b.height })));

  // 6. Footer Measurements
  console.log('Eve Footer Left Date (x=10..150, y=960..1020):', findTextBBox(eve, 10, 160, 960, 1020, (r, g, b) => r > 160 && g < 60 && b < 60));
  console.log('Eve Footer Right Date (x=600..745, y=960..1020):', findTextBBox(eve, 600, 745, 960, 1020, (r, g, b) => r > 160 && g < 60 && b < 60));
  console.log('Eve Footer Center Time (x=330..430, y=960..1020):', findTextBBox(eve, 330, 430, 960, 1020, (r, g, b) => (r*0.299 + g*0.587 + b*0.114) < 80 || (b > 120 && r < 50)));

  console.log('Mor Footer Left Date (x=10..160, y=960..1020):', findTextBBox(mor, 10, 160, 960, 1020, (r, g, b) => r > 160 && g < 60 && b < 60));
  console.log('Mor Footer Right Date (x=600..745, y=960..1020):', findTextBBox(mor, 600, 745, 960, 1020, (r, g, b) => r > 160 && g < 60 && b < 60));
  console.log('Mor Footer Center Time (x=330..430, y=960..1020):', findTextBBox(mor, 330, 430, 960, 1020, (r, g, b) => r > 160 && g < 60 && b < 60));
}

measure();
