/**
 * Stock Image Resolver v2 — Precision Matching
 * 
 * Complete rewrite with:
 * 1. Word-boundary matching (no more "cat" inside "education")
 * 2. Semantic phrase patterns with weighted scoring
 * 3. Industry-context awareness for ambiguous descriptions
 * 4. Smart fallback categories for generic descriptions
 * 5. 100+ categories with curated Unsplash photos
 */

// ═══════════════════════════════════════════════════════════════
// CURATED STOCK PHOTO LIBRARY
// ═══════════════════════════════════════════════════════════════

const STOCK_PHOTOS: Record<string, string[]> = {
  // ── FOOD & RESTAURANT ──
  food: [
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=400&h=300&fit=crop",
  ],
  pizza: [
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1588315029754-2dd089d39a1a?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=400&h=300&fit=crop",
  ],
  burger: [
    "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&h=300&fit=crop",
  ],
  coffee: [
    "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=300&fit=crop",
  ],
  restaurant: [
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=400&h=300&fit=crop",
  ],
  dessert: [
    "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&h=300&fit=crop",
  ],
  cake: [
    "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1558636508-e0db3814bd1d?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1621303837174-89787a7d4729?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1535141192574-5d4897c12636?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?w=400&h=300&fit=crop",
  ],
  sushi: [
    "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1553621042-f6e147245754?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1583623025817-d180a2221d0a?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=400&h=300&fit=crop",
  ],
  steak: [
    "https://images.unsplash.com/photo-1558030006-450675393462?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=400&h=300&fit=crop",
  ],
  pasta: [
    "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=400&h=300&fit=crop",
  ],
  salad: [
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=300&fit=crop",
  ],
  smoothie: [
    "https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1638176066666-ffb2f013c7dd?w=400&h=300&fit=crop",
  ],
  bakery: [
    "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1517433670267-08bbd4be890f?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop",
  ],
  icecream: [
    "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=400&h=300&fit=crop",
  ],
  tea: [
    "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1597318181409-cf64d0b5d8a2?w=400&h=300&fit=crop",
  ],
  wine: [
    "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1474722883778-792e7990302f?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=400&h=300&fit=crop",
  ],
  cocktail: [
    "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1536935338788-846bb9981813?w=400&h=300&fit=crop",
  ],

  // ── FASHION & CLOTHING ──
  fashion: [
    "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&h=300&fit=crop",
  ],
  clothing: [
    "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=400&h=300&fit=crop",
  ],
  shoes: [
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=400&h=300&fit=crop",
  ],
  sneakers: [
    "https://images.unsplash.com/photo-1552346154-21d32810aba3?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1584735175315-9d5df23860e6?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1597045566677-8cf032ed6634?w=400&h=300&fit=crop",
  ],
  dress: [
    "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1612336307429-8a898d10e223?w=400&h=300&fit=crop",
  ],
  jewelry: [
    "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=400&h=300&fit=crop",
  ],
  watch: [
    "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1539874754764-5a96559165b0?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=400&h=300&fit=crop",
  ],
  luxurywatch: [
    "https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1526045431048-f857369baa09?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1548171915-e79a380a2a4b?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1612817159949-195b6eb9e31a?w=400&h=300&fit=crop",
  ],
  bag: [
    "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=300&fit=crop",
  ],
  handbag: [
    "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1614179689702-355944cd0918?w=400&h=300&fit=crop",
  ],
  sunglasses: [
    "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1577803645773-f96470509666?w=400&h=300&fit=crop",
  ],
  suit: [
    "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=400&h=300&fit=crop",
  ],

  // ── TECHNOLOGY & ELECTRONICS ──
  technology: [
    "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=300&fit=crop",
  ],
  phone: [
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1556656793-08538906a9f8?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=400&h=300&fit=crop",
  ],
  smartphone: [
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400&h=300&fit=crop",
  ],
  laptop: [
    "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1484788984921-03950022c9ef?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=400&h=300&fit=crop",
  ],
  headphones: [
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400&h=300&fit=crop",
  ],
  smartwatch: [
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1617043786394-f977fa12eddf?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=400&h=300&fit=crop",
  ],
  camera: [
    "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1495707902641-75cac588d2e9?w=400&h=300&fit=crop",
  ],
  gaming: [
    "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1592840496694-26d035b52b48?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&h=300&fit=crop",
  ],
  tablet: [
    "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?w=400&h=300&fit=crop",
  ],
  speaker: [
    "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1589003077984-894e133dabab?w=400&h=300&fit=crop",
  ],
  television: [
    "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1461151304267-38535e780c79?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1558888401-3cc1de77652d?w=400&h=300&fit=crop",
  ],

  // ── BEAUTY & SKINCARE ──
  beauty: [
    "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1571875257727-256c39da42af?w=400&h=300&fit=crop",
  ],
  skincare: [
    "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1612817288484-6f916006741a?w=400&h=300&fit=crop",
  ],
  cosmetics: [
    "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=300&fit=crop",
  ],
  makeup: [
    "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1583241800698-e8ab01830a07?w=400&h=300&fit=crop",
  ],
  perfume: [
    "https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=400&h=300&fit=crop",
  ],
  spa: [
    "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=400&h=300&fit=crop",
  ],
  hair: [
    "https://images.unsplash.com/photo-1560869713-7d0a29430803?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400&h=300&fit=crop",
  ],
  haircare: [
    "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1597354984706-fac992d9306f?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1585751119414-ef2636f8aede?w=400&h=300&fit=crop",
  ],
  nails: [
    "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=400&h=300&fit=crop",
  ],
  salon: [
    "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=400&h=300&fit=crop",
  ],
  serum: [
    "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=300&fit=crop",
  ],
  massage: [
    "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=400&h=300&fit=crop",
  ],

  // ── HEALTH & FITNESS ──
  health: [
    "https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop",
  ],
  fitness: [
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=300&fit=crop",
  ],
  gym: [
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1576678927484-cc907957088c?w=400&h=300&fit=crop",
  ],
  yoga: [
    "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1588286840104-8957b019727f?w=400&h=300&fit=crop",
  ],
  doctor: [
    "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1666214280557-f1b5022eb634?w=400&h=300&fit=crop",
  ],
  medicine: [
    "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&h=300&fit=crop",
  ],
  dental: [
    "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1598256989800-fe5f95da9787?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=400&h=300&fit=crop",
  ],
  supplement: [
    "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1556740758-90de374c12ad?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400&h=300&fit=crop",
  ],
  pharmacy: [
    "https://images.unsplash.com/photo-1585435557343-3b092031a831?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1576602976047-174e57a47881?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&h=300&fit=crop",
  ],
  nutrition: [
    "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=400&h=300&fit=crop",
  ],
  laboratory: [
    "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1579165466741-7f35e4755660?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=400&h=300&fit=crop",
  ],
  hospital: [
    "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=400&h=300&fit=crop",
  ],

  // ── AUTOMOTIVE (generic/scenic shots — no identifiable brand logos) ──
  car: [
    "https://images.unsplash.com/photo-1485291571150-772bcfc10da5?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1532974297617-c0f05fe48bff?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1550355291-bbee04a92027?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=400&h=300&fit=crop",
  ],
  automotive: [
    "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1507136566006-cfc505b114fc?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1493238792000-8113da705763?w=400&h=300&fit=crop",
  ],
  suv: [
    "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1502489597346-dad15683d4c2?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400&h=300&fit=crop",
  ],
  electriccar: [
    "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1558981285-6f0c94958bb6?w=400&h=300&fit=crop",
  ],
  motorcycle: [
    "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1558980394-4c7c9299fe96?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=400&h=300&fit=crop",
  ],
  luxury: [
    "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1542362567-b07e54358753?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1507136566006-cfc505b114fc?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&h=300&fit=crop",
  ],

  // ── REAL ESTATE ──
  house: [
    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=400&h=300&fit=crop",
  ],
  apartment: [
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=300&fit=crop",
  ],
  realestate: [
    "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop",
  ],
  interior: [
    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=400&h=300&fit=crop",
  ],
  kitchen: [
    "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1600489000022-c2086d79f9d4?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1556909114-44e3e70034e2?w=400&h=300&fit=crop",
  ],
  bedroom: [
    "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1617325247661-675ab4b64ae2?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1615874959474-d609969a20ed?w=400&h=300&fit=crop",
  ],
  bathroom: [
    "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=400&h=300&fit=crop",
  ],
  pool: [
    "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop",
  ],
  penthouse: [
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=400&h=300&fit=crop",
  ],

  // ── TRAVEL & HOSPITALITY ──
  travel: [
    "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=400&h=300&fit=crop",
  ],
  hotel: [
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=300&fit=crop",
  ],
  beach: [
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1473116763249-2faaef81ccda?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?w=400&h=300&fit=crop",
  ],
  flight: [
    "https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?w=400&h=300&fit=crop",
  ],
  resort: [
    "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=400&h=300&fit=crop",
  ],
  mountain: [
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=400&h=300&fit=crop",
  ],
  cruise: [
    "https://images.unsplash.com/photo-1548574505-5e239809ee19?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1599640842225-85d111c60e6b?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop",
  ],
  camping: [
    "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1537905569824-f89f14cceb68?w=400&h=300&fit=crop",
  ],

  // ── EDUCATION ──
  education: [
    "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=400&h=300&fit=crop",
  ],
  book: [
    "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&h=300&fit=crop",
  ],
  student: [
    "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop",
  ],
  classroom: [
    "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1577896851231-70ef18881754?w=400&h=300&fit=crop",
  ],

  // ── FINANCE & BANKING ──
  finance: [
    "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=300&fit=crop",
  ],
  banking: [
    "https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1601597111158-2fceff292cdc?w=400&h=300&fit=crop",
  ],
  insurance: [
    "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1560472355-536de3962603?w=400&h=300&fit=crop",
  ],
  creditcard: [
    "https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop",
  ],
  investment: [
    "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=400&h=300&fit=crop",
  ],

  // ── ENTERTAINMENT & EVENTS ──
  concert: [
    "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&h=300&fit=crop",
  ],
  movie: [
    "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=400&h=300&fit=crop",
  ],
  party: [
    "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1496843916299-590492c751f4?w=400&h=300&fit=crop",
  ],
  music: [
    "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=400&h=300&fit=crop",
  ],
  sport: [
    "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=400&h=300&fit=crop",
  ],
  theater: [
    "https://images.unsplash.com/photo-1503095396549-807759245b35?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1507924538820-ede94a04019d?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=400&h=300&fit=crop",
  ],
  streaming: [
    "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=400&h=300&fit=crop",
  ],

  // ── PETS ──
  pet: [
    "https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&h=300&fit=crop",
  ],
  dog: [
    "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1587559070757-f72a388edbba?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1588943211346-0908a1fb0b01?w=400&h=300&fit=crop",
  ],
  cat: [
    "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?w=400&h=300&fit=crop",
  ],

  // ── HOME & GARDEN ──
  furniture: [
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=400&h=300&fit=crop",
  ],
  garden: [
    "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=400&h=300&fit=crop",
  ],
  plant: [
    "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400&h=300&fit=crop",
  ],
  cleaning: [
    "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1563453392212-326f5e854473?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=400&h=300&fit=crop",
  ],

  // ── LOGISTICS & DELIVERY ──
  delivery: [
    "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1580674285054-bed31e145f59?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1586880244406-556ebe35f282?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1609143739217-01b60dad1c67?w=400&h=300&fit=crop",
  ],
  package: [
    "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1529074963764-98f45c47344b?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?w=400&h=300&fit=crop",
  ],
  shipping: [
    "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&h=300&fit=crop",
  ],
  warehouse: [
    "https://images.unsplash.com/photo-1553413077-190dd305871c?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&h=300&fit=crop",
  ],

  // ── PEOPLE & PROFESSIONAL ──
  person: [
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=300&fit=crop",
  ],
  team: [
    "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop",
  ],
  office: [
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=400&h=300&fit=crop",
  ],
  professional: [
    "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=300&fit=crop",
  ],
  headshot: [
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=300&fit=crop",
  ],
  stylist: [
    "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?w=400&h=300&fit=crop",
  ],

  // ── GROCERY & ORGANIC ──
  grocery: [
    "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=400&h=300&fit=crop",
  ],
  organic: [
    "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=300&fit=crop",
  ],
  fruit: [
    "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400&h=300&fit=crop",
  ],
  vegetable: [
    "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1590779033100-9f60a05a013d?w=400&h=300&fit=crop",
  ],

  // ── NICHE INDUSTRIES ──
  construction: [
    "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=400&h=300&fit=crop",
  ],
  solar: [
    "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=400&h=300&fit=crop",
  ],
  laundry: [
    "https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?w=400&h=300&fit=crop",
  ],
  plumbing: [
    "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=400&h=300&fit=crop",
  ],
  printing: [
    "https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1598301257982-0cf014dabbcd?w=400&h=300&fit=crop",
  ],
  childcare: [
    "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=400&h=300&fit=crop",
  ],
  tutoring: [
    "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=300&fit=crop",
  ],
  catering: [
    "https://images.unsplash.com/photo-1555244162-803834f70033?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop",
  ],
  florist: [
    "https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=400&h=300&fit=crop",
  ],
  flower: [
    "https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=400&h=300&fit=crop",
  ],
  photography: [
    "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1554048612-b6a482bc67e5?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1471341971476-ae15ff5dd4ea?w=400&h=300&fit=crop",
  ],
  legal: [
    "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=400&h=300&fit=crop",
  ],
  accounting: [
    "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&h=300&fit=crop",
  ],
  taxi: [
    "https://images.unsplash.com/photo-1511994298241-608e28f14fde?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=400&h=300&fit=crop",
  ],
  moving: [
    "https://images.unsplash.com/photo-1600518464441-9154a4dea21b?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop",
  ],
  veterinary: [
    "https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1612531386530-97286d97c2d2?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=400&h=300&fit=crop",
  ],
  tailor: [
    "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=400&h=300&fit=crop",
  ],
  jeweler: [
    "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=400&h=300&fit=crop",
  ],
  optician: [
    "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400&h=300&fit=crop",
  ],
  telecom: [
    "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=300&fit=crop",
  ],

  // ── GENERIC / FALLBACK ──
  product: [
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop",
  ],
  store: [
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400&h=300&fit=crop",
  ],
  sale: [
    "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400&h=300&fit=crop",
  ],
  gift: [
    "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=400&h=300&fit=crop",
  ],
  celebration: [
    "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1496843916299-590492c751f4?w=400&h=300&fit=crop",
  ],
  nature: [
    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=300&fit=crop",
  ],
  wedding: [
    "https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=400&h=300&fit=crop",
  ],
  baby: [
    "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400&h=300&fit=crop",
  ],
  coupon: [
    "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop",
  ],
  discount: [
    "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400&h=300&fit=crop",
  ],
  notification: [
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400&h=300&fit=crop",
  ],
  success: [
    "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop",
  ],
  welcome: [
    "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&h=300&fit=crop",
  ],
  security: [
    "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=300&fit=crop",
  ],
  support: [
    "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=300&fit=crop",
  ],
};

// ═══════════════════════════════════════════════════════════════
// FALLBACK IMAGES (used when no category matches)
// ═══════════════════════════════════════════════════════════════

const FALLBACK_IMAGES: string[] = [
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&h=300&fit=crop",
];

// ═══════════════════════════════════════════════════════════════
// PRECISION MATCHING ENGINE
// ═══════════════════════════════════════════════════════════════

/**
 * Semantic phrase patterns — highest priority.
 * These catch multi-word concepts that simple keyword matching would miss or misroute.
 * Each pattern maps to a specific category with a high bonus score.
 */
const SEMANTIC_PATTERNS: Array<{ pattern: RegExp; category: string; score: number }> = [
  // PEOPLE & PROFESSIONAL
  { pattern: /headshot|portrait|profile\s*photo|professional\s*photo/i, category: "headshot", score: 25 },
  { pattern: /customer\s*support|call\s*center|help\s*desk|support\s*rep/i, category: "support", score: 25 },
  { pattern: /team\s*photo|group\s*photo|team\s*meeting|colleagues/i, category: "team", score: 25 },

  // BEAUTY & SALON
  { pattern: /hair\s*salon|salon\s*interior|styling\s*chair|barber\s*shop/i, category: "salon", score: 25 },
  { pattern: /hair\s*styl|hairdress|hair\s*cut/i, category: "salon", score: 25 },
  { pattern: /hair\s*serum|hair\s*product|shampoo|conditioner|hair\s*oil/i, category: "haircare", score: 25 },
  { pattern: /skin\s*care|moisturiz|facial\s*cream|serum\s*bottle|face\s*wash/i, category: "skincare", score: 25 },
  { pattern: /makeup\s*palette|makeup\s*brush|lipstick|foundation|mascara/i, category: "makeup", score: 25 },
  { pattern: /nail\s*polish|manicure|pedicure|nail\s*art/i, category: "nails", score: 25 },
  { pattern: /essential\s*oil|aromatherap|spa\s*treatment|facial\s*treatment/i, category: "spa", score: 25 },

  // HEALTH & MEDICAL
  { pattern: /doctor|physician|medical\s*professional|stethoscope|white\s*coat/i, category: "doctor", score: 25 },
  { pattern: /dentist|dental\s*(?:clinic|professional|equipment|chair)/i, category: "dental", score: 25 },
  { pattern: /blood\s*test|lab(?:oratory)?|test\s*tube|microscope|clinical/i, category: "laboratory", score: 25 },
  { pattern: /hospital|medical\s*(?:clinic|center|facility)|emergency\s*room/i, category: "hospital", score: 25 },
  { pattern: /vaccin|syringe|injection|medical\s*suppl/i, category: "medicine", score: 25 },
  { pattern: /telemedicine|telehealth|virtual\s*consult/i, category: "doctor", score: 25 },
  { pattern: /health\s*screen|health\s*check|medical\s*exam/i, category: "health", score: 25 },
  { pattern: /protein\s*shake|supplement|vitamin|whey/i, category: "supplement", score: 25 },
  { pattern: /personal\s*trainer|fitness\s*coach/i, category: "gym", score: 25 },

  // FOOD & BEVERAGE
  { pattern: /pizza|margherita|pepperoni/i, category: "pizza", score: 25 },
  { pattern: /burger|hamburger|cheeseburger/i, category: "burger", score: 25 },
  { pattern: /sushi|sashimi|maki\s*roll/i, category: "sushi", score: 25 },
  { pattern: /coffee\s*cup|latte|cappuccino|espresso/i, category: "coffee", score: 25 },
  { pattern: /cocktail|martini|mixed\s*drink/i, category: "cocktail", score: 25 },
  { pattern: /wine\s*(?:bottle|glass)|vineyard|sommelier/i, category: "wine", score: 20 },
  { pattern: /steak|grilled\s*meat|bbq|barbecue/i, category: "steak", score: 25 },
  { pattern: /restaurant\s*interior|dining\s*(?:room|table|area)|fine\s*dining|table\s*setting/i, category: "restaurant", score: 35 },
  { pattern: /smoothie\s*bowl|smoothie/i, category: "smoothie", score: 25 },
  { pattern: /bakery|fresh\s*bread|pastry|croissant/i, category: "bakery", score: 25 },
  { pattern: /ice\s*cream|gelato|frozen\s*yogurt/i, category: "icecream", score: 25 },

  // TECHNOLOGY & ELECTRONICS
  { pattern: /smart\s*phone|mobile\s*phone|iphone|android\s*phone/i, category: "phone", score: 25 },
  { pattern: /laptop|notebook\s*computer|macbook/i, category: "laptop", score: 20 },
  { pattern: /headphone|earphone|earbud|airpod/i, category: "headphones", score: 25 },
  { pattern: /smart\s*watch|fitness\s*track|apple\s*watch/i, category: "smartwatch", score: 25 },
  { pattern: /gaming\s*(?:setup|console|pc|chair|controller)/i, category: "gaming", score: 25 },
  { pattern: /smart\s*home|home\s*automation|iot\s*device/i, category: "technology", score: 25 },
  { pattern: /5g|network\s*tower|telecom|telecommun|cell\s*tower|sim\s*card/i, category: "telecom", score: 25 },
  { pattern: /data\s*plan|mobile\s*plan|broadband/i, category: "telecom", score: 25 },

  // AUTOMOTIVE
  { pattern: /sedan|hatchback|car\s*(?:model|showroom|interior|dashboard)/i, category: "car", score: 25 },
  { pattern: /electric\s*(?:car|vehicle)|ev\s*charg|tesla/i, category: "electriccar", score: 25 },
  { pattern: /motorcycle|motorbike/i, category: "motorcycle", score: 25 },
  { pattern: /car\s*service|auto\s*(?:repair|mechanic|service)|car\s*wash/i, category: "automotive", score: 25 },
  { pattern: /suv|sport\s*utility/i, category: "suv", score: 25 },
  { pattern: /luxury\s*(?:car|vehicle|sedan)/i, category: "luxury", score: 25 },
  // Automotive feature descriptions (cockpit, battery, range, engine, drivetrain, etc.)
  { pattern: /cockpit|infotainment|touchscreen\s*display|head\s*unit|instrument\s*cluster/i, category: "car", score: 20 },
  { pattern: /battery\s*(?:range|capacity|pack|life|charging)|long\s*range|fast\s*charg/i, category: "electriccar", score: 22 },
  { pattern: /horsepower|torque|engine\s*(?:performance|power|spec)|turbo(?:charged)?|v[468]\s*engine/i, category: "car", score: 22 },
  { pattern: /all\s*wheel\s*drive|awd|4wd|drivetrain|transmission/i, category: "suv", score: 20 },
  { pattern: /panoramic\s*(?:sunroof|roof)|sunroof|moonroof/i, category: "car", score: 20 },
  { pattern: /leather\s*(?:interior|seat|upholstery)|heated\s*seat|ventilated\s*seat/i, category: "car", score: 20 },
  { pattern: /test\s*drive|showroom|dealership|car\s*lot/i, category: "automotive", score: 22 },
  { pattern: /hybrid\s*(?:car|vehicle|engine|system)|plug\s*in\s*hybrid/i, category: "electriccar", score: 22 },
  { pattern: /autonomous|self\s*driving|autopilot|cruise\s*control|lane\s*assist/i, category: "car", score: 20 },
  { pattern: /car\s*(?:feature|spec|trim|variant|edition|model)|new\s*model/i, category: "car", score: 18 },
  { pattern: /(?:front|rear|side)\s*(?:view|profile|bumper|grille)/i, category: "car", score: 18 },
  { pattern: /(?:sport|premium|standard|base)\s*(?:trim|variant|edition|package|model)/i, category: "car", score: 15 },

  // TRAVEL & HOSPITALITY
  { pattern: /hotel\s*room|luxury\s*suite|resort\s*room|hotel\s*lobby/i, category: "hotel", score: 25 },
  { pattern: /beach\s*resort|infinity\s*pool|tropical\s*resort/i, category: "resort", score: 25 },
  { pattern: /airplane|aeroplane|flight|aviation|airport|boarding\s*pass/i, category: "flight", score: 25 },
  { pattern: /cruise\s*ship|ocean\s*liner/i, category: "cruise", score: 25 },
  { pattern: /mountain\s*(?:trail|hik|view|peak)|hiking\s*trail|summit/i, category: "mountain", score: 25 },
  { pattern: /tropical\s*beach|palm\s*tree|turquoise\s*water|seaside/i, category: "beach", score: 22 },

  // REAL ESTATE
  { pattern: /real\s*estate\s*agent|property\s*(?:agent|listing|viewing)/i, category: "realestate", score: 25 },
  { pattern: /swimming\s*pool|infinity\s*pool|pool\s*area/i, category: "pool", score: 25 },
  { pattern: /penthouse|luxury\s*(?:apartment|condo|loft)/i, category: "penthouse", score: 25 },
  { pattern: /marble\s*counter|modern\s*kitchen|kitchen\s*island/i, category: "kitchen", score: 25 },

  // EDUCATION
  { pattern: /university|campus|college|school\s*building/i, category: "education", score: 25 },
  { pattern: /online\s*(?:learning|course|class|education)|learning\s*platform/i, category: "education", score: 35 },
  { pattern: /classroom|lecture\s*hall|whiteboard|interactive\s*board/i, category: "classroom", score: 25 },
  { pattern: /teacher|professor|instructor|tutor/i, category: "education", score: 22 },
  { pattern: /textbook|study\s*material|school\s*book/i, category: "book", score: 25 },
  { pattern: /student|studying|library/i, category: "student", score: 20 },

  // FINANCE & BANKING
  { pattern: /credit\s*card|bank\s*card|payment\s*card|debit\s*card/i, category: "creditcard", score: 25 },
  { pattern: /stock\s*market|investment|portfolio|trading/i, category: "investment", score: 25 },
  { pattern: /bank\s*(?:branch|interior|building)|banking\s*app/i, category: "banking", score: 25 },
  { pattern: /mobile\s*banking|online\s*banking|fintech/i, category: "banking", score: 22 },
  { pattern: /insurance\s*(?:policy|card|document|plan|claim)/i, category: "insurance", score: 25 },
  { pattern: /financial\s*(?:document|report|planning|advisor)/i, category: "finance", score: 25 },

  // LOGISTICS
  { pattern: /delivery\s*(?:truck|package|rider|driver|van)/i, category: "delivery", score: 25 },
  { pattern: /shipping\s*(?:container|box|label)/i, category: "shipping", score: 25 },
  { pattern: /warehouse\s*(?:interior|shelving|storage)/i, category: "warehouse", score: 25 },
  { pattern: /package\s*(?:tracking|delivery|doorstep)|parcel|deliver(?:ed|ing)?\s*(?:to|at)/i, category: "delivery", score: 30 },
  { pattern: /moving\s*(?:truck|box)|relocation/i, category: "moving", score: 25 },

  // ENTERTAINMENT
  { pattern: /live\s*concert|stage\s*light|crowd\s*cheer/i, category: "concert", score: 25 },
  { pattern: /movie\s*theater|cinema|film\s*screen/i, category: "movie", score: 25 },
  { pattern: /music\s*festival|dj\s*booth|live\s*music/i, category: "music", score: 25 },
  { pattern: /sport\s*stadium|live\s*match|athletic/i, category: "sport", score: 25 },
  { pattern: /vip\s*(?:lounge|section|area|seat)|premium\s*seat/i, category: "party", score: 25 },
  { pattern: /stream(?:ing)?\s*(?:service|platform|content)/i, category: "streaming", score: 25 },

  // FASHION
  { pattern: /running\s*shoe|sneaker|athletic\s*shoe/i, category: "sneakers", score: 25 },
  { pattern: /luxury\s*watch|rolex|omega|chronograph/i, category: "luxurywatch", score: 25 },
  { pattern: /leather\s*(?:bag|handbag)|designer\s*bag/i, category: "handbag", score: 25 },
  { pattern: /fashion\s*(?:boutique|store|collection|show)/i, category: "fashion", score: 25 },
  { pattern: /clothing\s*(?:store|collection|rack|display)/i, category: "clothing", score: 25 },

  // PEOPLE & LIFESTYLE
  { pattern: /family\s*(?:using|watching|enjoying|at\s*home)|(?:people|person|customer)\s*(?:using|with|giving|happy)/i, category: "technology", score: 18 },
  { pattern: /happy\s*(?:customer|person|woman|man)|thumbs\s*up|satisfied\s*customer|customer\s*review/i, category: "person", score: 25 },

  // GENERIC / CONTEXTUAL
  { pattern: /flash\s*sale|big\s*sale|clearance|mega\s*sale/i, category: "sale", score: 25 },
  { pattern: /shopping\s*(?:bag|cart|mall|center)/i, category: "store", score: 22 },
  { pattern: /welcome\s*(?:message|banner|screen)|onboard/i, category: "welcome", score: 25 },
  { pattern: /thank\s*you|appreciation|grateful/i, category: "success", score: 25 },
  { pattern: /appointment|booking\s*confirm|reservation\s*confirm/i, category: "success", score: 22 },
  { pattern: /verif(?:y|ication)|otp|security\s*(?:code|shield|lock)/i, category: "security", score: 25 },
  { pattern: /subscription|renewal|membership/i, category: "notification", score: 22 },
  { pattern: /promotional\s*banner|promo(?:tion)?/i, category: "product", score: 18 },
  { pattern: /food\s*delivery|meal\s*delivery/i, category: "delivery", score: 25 },
  { pattern: /gift\s*(?:box|wrap|card)/i, category: "gift", score: 25 },
  { pattern: /wedding\s*(?:dress|venue|ceremony|reception)/i, category: "wedding", score: 25 },
  { pattern: /pet\s*(?:food|care|grooming|shop)/i, category: "pet", score: 25 },
  { pattern: /flower\s*(?:bouquet|arrangement|delivery)/i, category: "florist", score: 25 },
  { pattern: /gym\s*(?:interior|equipment|floor)|workout\s*area|fitness\s*center/i, category: "gym", score: 25 },
  { pattern: /office\s*(?:space|interior|building)|cowork|workspace/i, category: "office", score: 25 },
  { pattern: /reception\s*area|lobby/i, category: "office", score: 20 },
];

/**
 * Word-boundary keyword matching.
 * Unlike substring matching, this ensures "cat" doesn't match inside "education".
 * Keywords are grouped by priority (longer/more specific = higher score).
 */
interface KeywordRule {
  word: string;
  category: string;
  score: number;
}

const KEYWORD_RULES: KeywordRule[] = [
  // High-specificity keywords (exact domain terms) — score 15
  { word: "pizza", category: "pizza", score: 15 },
  { word: "burger", category: "burger", score: 15 },
  { word: "sushi", category: "sushi", score: 15 },
  { word: "steak", category: "steak", score: 15 },
  { word: "pasta", category: "pasta", score: 15 },
  { word: "salad", category: "salad", score: 15 },
  { word: "dessert", category: "dessert", score: 15 },
  { word: "cake", category: "cake", score: 15 },
  { word: "bakery", category: "bakery", score: 15 },
  { word: "coffee", category: "coffee", score: 15 },
  { word: "cocktail", category: "cocktail", score: 15 },
  { word: "smoothie", category: "smoothie", score: 15 },
  { word: "restaurant", category: "restaurant", score: 15 },
  { word: "skincare", category: "skincare", score: 15 },
  { word: "cosmetics", category: "cosmetics", score: 15 },
  { word: "makeup", category: "makeup", score: 15 },
  { word: "perfume", category: "perfume", score: 15 },
  { word: "fragrance", category: "perfume", score: 15 },
  { word: "salon", category: "salon", score: 15 },
  { word: "headphones", category: "headphones", score: 15 },
  { word: "smartwatch", category: "smartwatch", score: 15 },
  { word: "laptop", category: "laptop", score: 12 },
  { word: "smartphone", category: "smartphone", score: 15 },
  { word: "camera", category: "camera", score: 15 },
  { word: "gaming", category: "gaming", score: 15 },
  { word: "tablet", category: "tablet", score: 15 },
  { word: "speaker", category: "speaker", score: 15 },
  { word: "television", category: "television", score: 15 },
  { word: "sneakers", category: "sneakers", score: 15 },
  { word: "jewelry", category: "jewelry", score: 15 },
  { word: "jewellery", category: "jewelry", score: 15 },
  { word: "handbag", category: "handbag", score: 15 },
  { word: "sunglasses", category: "sunglasses", score: 15 },
  { word: "motorcycle", category: "motorcycle", score: 15 },
  { word: "apartment", category: "apartment", score: 15 },
  { word: "penthouse", category: "penthouse", score: 15 },
  { word: "kitchen", category: "kitchen", score: 15 },
  { word: "bedroom", category: "bedroom", score: 15 },
  { word: "bathroom", category: "bathroom", score: 15 },
  { word: "warehouse", category: "warehouse", score: 15 },
  { word: "delivery", category: "delivery", score: 15 },
  { word: "shipping", category: "shipping", score: 15 },
  { word: "insurance", category: "insurance", score: 15 },
  { word: "investment", category: "investment", score: 15 },
  { word: "classroom", category: "classroom", score: 15 },
  { word: "construction", category: "construction", score: 15 },
  { word: "laundry", category: "laundry", score: 15 },
  { word: "plumbing", category: "plumbing", score: 15 },
  { word: "childcare", category: "childcare", score: 15 },
  { word: "catering", category: "catering", score: 15 },
  { word: "florist", category: "florist", score: 15 },
  { word: "photography", category: "photography", score: 15 },
  { word: "veterinary", category: "veterinary", score: 15 },
  { word: "wedding", category: "wedding", score: 15 },
  { word: "celebration", category: "celebration", score: 15 },
  { word: "concert", category: "concert", score: 15 },
  { word: "theater", category: "theater", score: 15 },
  { word: "theatre", category: "theater", score: 15 },
  { word: "camping", category: "camping", score: 15 },
  { word: "cruise", category: "cruise", score: 15 },
  { word: "resort", category: "resort", score: 15 },
  { word: "mountain", category: "mountain", score: 12 },
  { word: "beach", category: "beach", score: 12 },
  { word: "hotel", category: "hotel", score: 15 },
  { word: "dental", category: "dental", score: 15 },
  { word: "pharmacy", category: "pharmacy", score: 15 },
  { word: "laboratory", category: "laboratory", score: 15 },
  { word: "hospital", category: "hospital", score: 15 },

  // Medium-specificity keywords — score 10
  { word: "food", category: "food", score: 10 },
  { word: "fashion", category: "fashion", score: 10 },
  { word: "clothing", category: "clothing", score: 10 },
  { word: "shoes", category: "shoes", score: 10 },
  { word: "dress", category: "dress", score: 10 },
  { word: "watch", category: "watch", score: 10 },
  { word: "phone", category: "phone", score: 10 },
  { word: "beauty", category: "beauty", score: 10 },
  { word: "health", category: "health", score: 10 },
  { word: "fitness", category: "fitness", score: 10 },
  { word: "yoga", category: "yoga", score: 10 },
  { word: "doctor", category: "doctor", score: 10 },
  { word: "medicine", category: "medicine", score: 10 },
  { word: "medical", category: "doctor", score: 10 },
  { word: "automotive", category: "automotive", score: 10 },
  { word: "vehicle", category: "car", score: 10 },
  { word: "house", category: "house", score: 10 },
  { word: "interior", category: "interior", score: 8 },
  { word: "travel", category: "travel", score: 10 },
  { word: "education", category: "education", score: 10 },
  { word: "finance", category: "finance", score: 10 },
  { word: "banking", category: "banking", score: 10 },
  { word: "technology", category: "technology", score: 10 },
  { word: "office", category: "office", score: 10 },
  { word: "nature", category: "nature", score: 10 },
  { word: "garden", category: "garden", score: 10 },
  { word: "furniture", category: "furniture", score: 10 },
  { word: "cleaning", category: "cleaning", score: 10 },
  { word: "solar", category: "solar", score: 10 },
  { word: "organic", category: "organic", score: 10 },
  { word: "grocery", category: "grocery", score: 10 },
  { word: "fruit", category: "fruit", score: 10 },
  { word: "vegetable", category: "vegetable", score: 10 },
  { word: "plant", category: "plant", score: 10 },
  { word: "flower", category: "flower", score: 10 },
  { word: "legal", category: "legal", score: 10 },
  { word: "accounting", category: "accounting", score: 10 },
  { word: "printing", category: "printing", score: 10 },
  { word: "tutoring", category: "tutoring", score: 10 },
  { word: "moving", category: "moving", score: 10 },
  { word: "tailor", category: "tailor", score: 10 },
  { word: "optician", category: "optician", score: 10 },
  { word: "music", category: "music", score: 10 },
  { word: "movie", category: "movie", score: 10 },
  { word: "sport", category: "sport", score: 10 },
  { word: "sports", category: "sport", score: 10 },
  { word: "party", category: "party", score: 10 },
  { word: "concert", category: "concert", score: 10 },
  { word: "student", category: "student", score: 10 },
  { word: "book", category: "book", score: 8 },
  { word: "flight", category: "flight", score: 10 },
  { word: "pool", category: "pool", score: 10 },
  { word: "gym", category: "gym", score: 10 },
  { word: "wine", category: "wine", score: 10 },
  { word: "product", category: "product", score: 8 },
  { word: "store", category: "store", score: 8 },
  { word: "sale", category: "sale", score: 8 },
  { word: "discount", category: "sale", score: 8 },
  { word: "coupon", category: "coupon", score: 8 },
  { word: "gift", category: "gift", score: 8 },
  { word: "baby", category: "baby", score: 10 },
  { word: "pet", category: "pet", score: 10 },
  { word: "dog", category: "dog", score: 10 },

  // Low-specificity (short/ambiguous) — score 5, only match with word boundaries
  { word: "car", category: "car", score: 5 },
  { word: "suv", category: "suv", score: 8 },
  { word: "bag", category: "bag", score: 5 },
  { word: "spa", category: "spa", score: 8 },
  { word: "tea", category: "tea", score: 8 },
  { word: "cat", category: "cat", score: 5 },
  { word: "tv", category: "television", score: 5 },
  { word: "hair", category: "hair", score: 5 },
  { word: "nail", category: "nails", score: 5 },
  { word: "nails", category: "nails", score: 8 },
  { word: "suit", category: "suit", score: 5 },
  { word: "taxi", category: "taxi", score: 8 },
  { word: "person", category: "person", score: 5 },
  { word: "team", category: "team", score: 5 },
  { word: "luxury", category: "luxury", score: 5 },
  { word: "package", category: "package", score: 8 },
  { word: "serum", category: "serum", score: 8 },
];

// Pre-compile word boundary regex for each keyword for performance
const COMPILED_KEYWORDS: Array<{ regex: RegExp; category: string; score: number }> = KEYWORD_RULES.map(rule => ({
  regex: new RegExp(`\\b${rule.word}\\b`, "i"),
  category: rule.category,
  score: rule.score,
}));

// ═══════════════════════════════════════════════════════════════
// SESSION STATE (deduplication within a single thread generation)
// ═══════════════════════════════════════════════════════════════

let usedInSession: Set<string> = new Set();

// ═══════════════════════════════════════════════════════════════
// CORE MATCHING FUNCTION
// ═══════════════════════════════════════════════════════════════

/**
 * Find the best matching category for a description using a multi-layer approach:
 * 1. Semantic phrase patterns (highest priority — multi-word concepts)
 * 2. Word-boundary keyword matching (medium priority — individual terms)
 * 3. Returns null if no match found (caller uses fallback)
 */
function findBestCategory(description: string): string | null {
  const lower = description.toLowerCase();
  const scores: Record<string, number> = {};

  // Layer 1: Semantic patterns (highest priority, compound phrases)
  for (const { pattern, category, score } of SEMANTIC_PATTERNS) {
    if (pattern.test(lower)) {
      scores[category] = (scores[category] || 0) + score;
    }
  }

  // Layer 2: Word-boundary keywords
  for (const { regex, category, score } of COMPILED_KEYWORDS) {
    if (regex.test(lower)) {
      scores[category] = (scores[category] || 0) + score;
    }
  }

  // Find the highest scoring category
  let bestCategory: string | null = null;
  let bestScore = 0;
  for (const [category, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  return bestCategory;
}

// ═══════════════════════════════════════════════════════════════
// DETERMINISTIC IMAGE SELECTION
// ═══════════════════════════════════════════════════════════════

/**
 * Simple hash function for deterministic selection.
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Pick an image from a category, avoiding duplicates within the session.
 * Falls back to allowing duplicates if all images in the category are used.
 */
function pickImage(candidates: string[], description: string): string {
  const hash = simpleHash(description);

  // Try to find an unused image
  const unused = candidates.filter(url => !usedInSession.has(url));
  if (unused.length > 0) {
    const idx = hash % unused.length;
    const picked = unused[idx];
    usedInSession.add(picked);
    return picked;
  }

  // All used — allow duplicate but still deterministic
  const idx = hash % candidates.length;
  return candidates[idx];
}

// ═══════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════

/**
 * Reset the session deduplication tracker.
 * Call this at the start of each new thread generation.
 */
export function resetImageSession(): void {
  usedInSession = new Set();
}

/**
 * Get all available category names.
 */
export function getCategories(): string[] {
  return Object.keys(STOCK_PHOTOS);
}

/**
 * Get all images for a specific category.
 */
export function getCategoryImages(category: string): string[] {
  return STOCK_PHOTOS[category.toLowerCase()] || FALLBACK_IMAGES;
}

/**
 * Get alternative images for swapping (used by the UI swap feature).
 * Returns up to 6 alternatives from the same or similar category.
 */
export function getAlternatives(currentUrl: string, description?: string): string[] {
  // First, find which category the current URL belongs to
  let matchedCategory: string | null = null;
  for (const [category, urls] of Object.entries(STOCK_PHOTOS)) {
    if (urls.includes(currentUrl)) {
      matchedCategory = category;
      break;
    }
  }

  // If URL not found in any category, try matching by description
  if (!matchedCategory && description) {
    matchedCategory = findBestCategory(description);
  }

  // Get candidates from matched category or fallback
  const candidates = matchedCategory
    ? (STOCK_PHOTOS[matchedCategory] || FALLBACK_IMAGES)
    : FALLBACK_IMAGES;

  // Return alternatives excluding the current URL, up to 6
  return candidates
    .filter(url => url !== currentUrl)
    .slice(0, 6);
}

/**
 * Resolve a single image description to a stock photo URL.
 */
export function resolveStockImage(description: string): string {
  const category = findBestCategory(description);
  const candidates = category ? (STOCK_PHOTOS[category] || FALLBACK_IMAGES) : FALLBACK_IMAGES;
  return pickImage(candidates, description);
}

/**
 * Resolve all stock images in a message array.
 * Mutates the messages in place and returns the array.
 * 
 * When brandContext is provided (from website crawl), the brand name is prepended
 * to image descriptions so AI image generation creates brand-appropriate images.
 * Also preserves the original GENERATE_IMAGE description in _headerImageDescription
 * so background AI generation can still detect and replace header stock images.
 */
export function resolveAllStockImages(messages: any[], brandContext?: string, industryHint?: string): any[] {
  resetImageSession();

  // Detect industry from message context if not provided
  const detectedIndustry = industryHint || detectIndustryFromMessages(messages);

  for (const msg of messages) {
    const content = msg?.content;
    if (!content) continue;

    // Template header image with GENERATE_IMAGE: prefix
    if (content.headerImageUrl && typeof content.headerImageUrl === "string" && content.headerImageUrl.startsWith("GENERATE_IMAGE:")) {
      const desc = content.headerImageUrl.replace("GENERATE_IMAGE:", "").trim();
      // Preserve the original description so AI generation can still replace the stock image
      content._headerImageDescription = brandContext ? `${brandContext} - ${desc}` : desc;
      content.headerImageUrl = resolveStockImageWithIndustry(desc, detectedIndustry);
    }

    // Image message with imageDescription but no imageUrl
    if (content.imageDescription && !content.imageUrl) {
      // Enrich imageDescription with brand context for AI generation
      if (brandContext && !content.imageDescription.toLowerCase().includes(brandContext.toLowerCase())) {
        content.imageDescription = `${brandContext} - ${content.imageDescription}`;
      }
      content.imageUrl = resolveStockImageWithIndustry(content.imageDescription, detectedIndustry);
    }

    // Video message with videoDescription but no videoPosterUrl
    if (content.videoDescription && !content.videoPosterUrl) {
      if (brandContext && !content.videoDescription.toLowerCase().includes(brandContext.toLowerCase())) {
        content.videoDescription = `${brandContext} - ${content.videoDescription}`;
      }
      content.videoPosterUrl = resolveStockImageWithIndustry(content.videoDescription, detectedIndustry);
    }

    // Carousel cards
    if (content.carouselCards && Array.isArray(content.carouselCards)) {
      for (const card of content.carouselCards) {
        if (card.imageDescription && !card.imageUrl) {
          // Enrich card imageDescription with brand context
          if (brandContext && !card.imageDescription.toLowerCase().includes(brandContext.toLowerCase())) {
            card.imageDescription = `${brandContext} - ${card.imageDescription}`;
          }
          card.imageUrl = resolveStockImageWithIndustry(card.imageDescription, detectedIndustry);
        }
      }
    }
  }

  return messages;
}

/**
 * Industry-to-fallback-category mapping.
 * When the stock image matcher can't find a specific category match,
 * use the industry context to pick a relevant fallback instead of generic images.
 */
const INDUSTRY_FALLBACK_CATEGORIES: Record<string, string[]> = {
  automotive: ["car", "automotive", "suv", "electriccar", "luxury"],
  beauty: ["beauty", "skincare", "cosmetics", "salon", "spa"],
  ecommerce: ["product", "store", "fashion", "clothing"],
  education: ["education", "classroom", "student", "book"],
  finance: ["finance", "banking", "investment", "creditcard"],
  food: ["food", "restaurant", "coffee", "bakery"],
  healthcare: ["health", "doctor", "hospital", "pharmacy"],
  hospitality: ["hotel", "resort", "travel", "beach"],
  realestate: ["house", "apartment", "realestate", "interior"],
  retail: ["store", "product", "fashion", "clothing"],
  technology: ["technology", "laptop", "smartphone", "software"],
  telecom: ["telecom", "smartphone", "technology"],
  logistics: ["delivery", "shipping", "warehouse"],
  fitness: ["fitness", "gym", "yoga", "sport"],
};

/**
 * Detect industry from message content by scanning all descriptions.
 */
function detectIndustryFromMessages(messages: any[]): string | null {
  const allText = messages.map(m => {
    const c = m?.content;
    if (!c) return "";
    const parts: string[] = [];
    if (c.headerImageUrl && typeof c.headerImageUrl === "string") parts.push(c.headerImageUrl);
    if (c.imageDescription) parts.push(c.imageDescription);
    if (c.text) parts.push(c.text);
    if (c.carouselCards) {
      for (const card of c.carouselCards) {
        if (card.title) parts.push(card.title);
        if (card.imageDescription) parts.push(card.imageDescription);
      }
    }
    return parts.join(" ");
  }).join(" ").toLowerCase();

  // Check for automotive signals
  if (/\b(?:car|vehicle|motor|sedan|suv|hatchback|cockpit|engine|horsepower|torque|drivetrain|test\s*drive|dealership|showroom|electric\s*vehicle|ev\s*charg|battery\s*range)\b/i.test(allText)) {
    return "automotive";
  }
  if (/\b(?:salon|skincare|cosmetic|makeup|beauty|facial|hair\s*styl|manicure|pedicure)\b/i.test(allText)) {
    return "beauty";
  }
  if (/\b(?:restaurant|menu|dish|cuisine|chef|dining|food|pizza|burger|sushi)\b/i.test(allText)) {
    return "food";
  }
  if (/\b(?:hotel|resort|travel|flight|booking|vacation|holiday|tourism)\b/i.test(allText)) {
    return "hospitality";
  }
  if (/\b(?:doctor|hospital|clinic|medical|health|patient|pharmacy|dental)\b/i.test(allText)) {
    return "healthcare";
  }
  if (/\b(?:property|house|apartment|condo|real\s*estate|mortgage|bedroom|listing)\b/i.test(allText)) {
    return "realestate";
  }
  return null;
}

/**
 * Resolve a stock image with industry-aware fallback.
 * If the description doesn't match any specific category, use the industry
 * context to pick a relevant fallback image instead of generic ones.
 */
function resolveStockImageWithIndustry(description: string, industry: string | null): string {
  const category = findBestCategory(description);
  if (category) {
    const candidates = STOCK_PHOTOS[category] || FALLBACK_IMAGES;
    return pickImage(candidates, description);
  }

  // No category match — use industry-aware fallback
  if (industry) {
    const fallbackCategories = INDUSTRY_FALLBACK_CATEGORIES[industry.toLowerCase()];
    if (fallbackCategories) {
      // Collect all images from industry-relevant categories
      const industryCandidates: string[] = [];
      for (const cat of fallbackCategories) {
        const catImages = STOCK_PHOTOS[cat];
        if (catImages) industryCandidates.push(...catImages);
      }
      if (industryCandidates.length > 0) {
        return pickImage(industryCandidates, description);
      }
    }
  }

  return pickImage(FALLBACK_IMAGES, description);
}
