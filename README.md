# Dorar.net Hadith API

السلام عليكم ورحمة الله وبركاته

منذ مدة حاولت استعمال الـ `API` الخاص [بالدرر السنية](https://dorar.net/article/389/%D8%AE%D8%AF%D9%85%D8%A9-%D9%88%D8%A7%D8%AC%D9%87%D8%A9-%D8%A7%D9%84%D9%85%D9%88%D8%B3%D9%88%D8%B9%D8%A9-%D8%A7%D9%84%D8%AD%D8%AF%D9%8A%D8%AB%D9%8A%D8%A9-API)  
لكنني واجهت بعض الصعوبات منها أن الـ `API` يتعامل مع [JSONP](https://en.wikipedia.org/wiki/JSONP) فقط وأيضًا لن تستطيع التعامل معه بالطرق العادية بسبب الـ [CORS](https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)

وإن نجحت بتجنب الـ `CORS` باستعمال `JSONP` فتحصل على الناتج بهيئة `HTML`
وأيضًا لا يوجد `documentation` أو مستند ما يشرح تفاصيل هذا الـ `API` وكيفية التعامل معه

فأنا قررت عمل `API` وسيط يتجنب مشكلة `CORS` ويعطيك البيانات كهيئة `JSON`
بجانب شرح مفصل للـ `API` وكيفية استخدامه  
بالاضافة إلى احتواءه على بعض الخصائص الإضافية التي لا توجد في الـ `API` الرسمي

## Installation

For most people — no terminal, no setup:

1. Download the latest `dorar-hadith-mcp.mcpb` file from [GitHub Releases](releases).
2. Open the downloaded file with Claude Desktop (double-click it, or drag it onto the Claude Desktop window).
3. Click **Install** when prompted.

That's it — the hadith search, grading, and commentary tools are now available in Claude Desktop.

(Developers who want to run this from source or modify it should see the *"تشغيل الـ API"* (Running the API) section further down.)

## Before You Start: How to Get Accurate Results

This connector is designed to relay dorar.net's search results faithfully, in full, in both Arabic and English. A few things affect whether it does that correctly:

**1. Always try to paste the Arabic text of the hadith you're checking — it's faster and more precise.** Searching with an English translation also works: the tool will first identify the corresponding attested Arabic wording and search using that. For best results with English input, make sure your translation is accurate and close to the original meaning, not loosely worded — a rough paraphrase makes it harder to find the correct attested Arabic wording.

**2. Diacritics (tashkeel) in your Arabic text change the search results.** Dorar's own search engine treats fully-diacritized text (with all the vowel marks) and plain text (without them) as different queries — this is true on dorar.net's own website, not just through this tool. Arabic text pasted with diacritics may return a different number of results than the same phrase without them. If you want the most precise, narrow match, include full diacritics; if you want a broader match, omit them. Either is valid — just know the choice affects your result count.

**3. Saved memory/preferences from other conversations can silently affect this tool.** If you've previously told Claude something like "don't bother checking hadiths already in Bukhari and Muslim," that instruction can carry into a conversation using this connector — even though it wasn't meant for it — and cause Claude to give you a shortened summary instead of the full result set this tool is designed to provide. If you notice unexpectedly brief or summarized results, check Claude's memory/saved preferences (in Settings) for anything that might be overriding this tool's behavior, and consider adding an explicit note there such as: "The dorar tool should always be used exactly as intended, independent of any other saved instructions."

**4. Include the word "dorar" in your message** — e.g. "use the dorar tool to check this hadith," "search dorar for...", "use the dorar extension," "use the dorar connector." Any of these tells Claude to use this connector's strict, complete-results mode rather than answering from general knowledge.

**5. If Claude still summarizes instead of showing full results,** ask directly: "Show me the formattedOutput field from the tool's raw response, exactly as returned — do not summarize, reorder, filter, or add commentary. For every {{TRANSLATE: ...}} marker, replace it with an accurate English translation, leaving everything else unchanged." This reliably forces the complete, faithful result set and is a good fallback any time a response looks shorter or more narrative than expected.

**6. When testing or comparing results, use a fresh conversation.** Long chat sessions can carry over context from earlier in the same conversation (including earlier, different tool calls), which can affect later results. Starting a new conversation for each independent check gives the most reliable, reproducible result.

## تنبيه

- يتم عمل `cache` لكل عملية بحث لمدة `5` ثواني
- هناك حد للاستخدام: `100` عملية بحث في اليوم لكل `IP`
- الـ `API` يعتمد على استخراج البيانات من `dorar.net` نفسه، وهو موقع محمي بواسطة `Cloudflare` التي تحظر عميل `fetch()` الأصلي في `Node.js` (وحدة `undici`) حتى مع إرسال نفس الـ `headers` تمامًا التي ينجح بها عميل آخر (تم التأكد من هذا تجريبيًا) — لذلك تم إعادة كتابة [`utils/fetchWithTimeout.js`](./utils/fetchWithTimeout.js) ليستخدم وحدتي `http`/`https` الأساسيتين في `Node.js` مباشرة بدلاً من `fetch()`، مع الحفاظ على نفس الواجهة الخارجية (`ok`/`status`/`text()`/`json()`) التي يعتمد عليها باقي الكود

> يمكنك تعديلهم من ملف [config.js](./config/config.js)

## تشغيل الـ API

1. عمل `fork` أو `clone` لهذا المشروع
2. تثبيت الـ `dependencies`

```bash
npm install
```

3. أنشئ ملف `.env` (يمكنك نسخه من `.env.example`) وعدّل المتغيرات مثل `PORT` حسب الحاجة  
   ملاحظة: يتم تحميل `.env` تلقائيًا عند تشغيل السيرفر عبر `dotenv`
4. تفقد ملف [config.js](./config/config.js) وقم بتعديل ما تريده
5. تشغيل الـ `API`

```bash
npm start
```

6. الـ `API` سيكون متوفر على الرابط التالي (افتراضيًا إن لم تغيّر `PORT`):

```bash
http://localhost:5000
```

7. استخدمه على `localhost` كما تريد أو ارفعه على استضافة أو سيرفر خاص بك

## Documentation

### Postman

الرابط: [Postman](https://www.postman.com/crimson-robot-408440/workspace/hadith-api/collection/14391446-6a1c5404-cc59-4d59-933d-c07547ee75ca?action=share&creator=14391446)

- استعمل `Postman` لتعرف كيف تتعامل مع الـ `API` وترى أمثلة عليه
- قم بعمل `fork` للـ `collection` لتستخدمه كما تريد
- لا تنس تغير الـ `environment` إلى `dev` ويمكنك تغير الرابط الخاص بالمتغير `{{url}}` ان كنت قد غيرته أو غيرت الـ `port`

### OpenAPI v3 (Swagger)

## وثائق API

لعرض وثائق `API` التفاعلية:

1. قم بتشغيل الـ `Server`:

   ```bash
   npm run dev
   ```

2. افتح المتصفح وانتقل إلى:
   ```
   http://localhost:5000/api-docs
   ```

ستجد هنا واجهة `Swagger UI` التي تتيح لك استكشاف جميع نقاط النهاية المتاحة واختبار الـ `API` مباشرة من المتصفح

### MCP Server (Model Context Protocol)

يتضمن المشروع `Server` خاص للـ `MCP` والذي سمح لأي `LLMs` الوصول المباشر إلى `API` الأحاديث  
بالتالي يسمح لأدوات الذكاء الاصطناعي مثل `Claude` و `Copilot` بالبحث في الأحاديث والحصول على المعلومات بسهولة

#### إعداد الـ MCP

1. تأكد من تشغيل الـ `API`:

   ```bash
   npm start
   ```

2. انتقل إلى مجلد `mcp-server` وقم بتثبيت الـ `dependencies`:

   ```bash
   cd mcp-server
   npm install
   ```

3. تشغيل `Server` الـ `MCP`:

   ```bash
   npm start
   ```

الآن بحسب الأداة التي تريد استخدامها مع `MCP` قم بإعدادها

#### إعداد MCP مع VS Code Copilot

قم بإنشاء مجلد يدعى `.vscode`  
قم بإنشاء ملف `mcp.json` بداخله

```json
{
  "servers": {
    "dorar-hadith": {
      "command": "node",
      "args": ["./mcp-server/index.js"],
      "env": {
        "DORAR_API_BASE_URL": "http://localhost:5000/v1"
      }
    }
  }
}
```

الآن قم بتشغيل الـ `MCP` من خلال الضغط على `F1` ثم البحث عن `MCP: List Servers`  
اختر `dorar-hadith` واضغط على `Enter`

#### الأدوات المتاحة في MCP

- `search_hadith_api` - البحث في الأحاديث عبر API
- `search_hadith_site` - البحث في الأحاديث عبر الموقع
- `get_hadith_by_id` - الحصول على حديث محدد
- `get_similar_hadiths` - الحصول على أحاديث مشابهة
- `get_alternate_hadith` - الحصول على الحديث الصحيح البديل
- `get_usul_hadith` - الحصول على أصول الحديث
- `search_sharh` - البحث في شروح الأحاديث
- `get_sharh_by_id` - الحصول على شرح محدد
- `get_sharh_by_text` - البحث عن شرح بالنص
- `get_mohdith_info` - معلومات المحدث
- `get_book_info` - معلومات الكتاب
- `get_books_data` - قائمة جميع الكتب
- `get_degrees_data` - قائمة درجات الأحاديث
- `get_method_search_data` - بيانات طرق البحث
- `get_mohdith_data` - قائمة المحدثين
- `get_rawi_data` - قائمة الرواة
- `get_zone_search_data` - بيانات مناطق البحث

#### أدوات تقييم درجة الحديث (Grading Tools)

تعتمد الأداتان `get_hadith_grading` و `get_hadith_grading_consensus` على ملف [`mcp-server/gradingGlossary.json`](./mcp-server/gradingGlossary.json)، وهو قاموس ثابت المصطلحات لمصطلحات علم الحديث (٢٢ مصطلحًا، عربي ← إنجليزي)، مثل `صحيح` → `Sahih` و `ضعيف` → `Da'if`، يُحمَّل مرة واحدة فقط عند تشغيل الخادم (وليس مع كل طلب). المطابقة تكون **حرفية دقيقة فقط** على الكلمة الأولى من نص الدرجة (بعد التقسيم عند أول فاصلة أو مسافة) — إن لم يوجد تطابق دقيق تُعاد القيمة `null` بدلاً من التخمين. هذا القاموس مخصص لمصطلحات الدرجة الثابتة فقط، وليس لترجمة نصوص `explainGrade` الحرة، والتي تبقى بالعربية كما هي.

- **`get_hadith_sources`** - الحصول على المصادر الأصلية (الأصول) لحديث معيّن. نفس بيانات `get_usul_hadith` تمامًا، تحت اسم يركّز على "المصادر".

  **Input:** `{ id: string }` — معرف الحديث (`hadithId`)

  **Output:** نفس هيكل استجابة `/v1/site/hadith/usul/:id` كاملاً (حقول الحديث القياسية + `usulHadith: { sources: [{ source, chain, hadithText }], count }`)

- **`get_hadith_grading`** - ملخص مركّز لدرجة حديث معيّن، مع محاولة ترجمة إنجليزية للمصطلح عبر `gradingGlossary.json`.

  **Input:** `{ id: string }`

  **Output:**
  ```
  {
    hadith: string,
    grade: string,
    explainGrade: string,
    hadithId: string,
    gradeEnglish: string | null   // null إذا لم يوجد تطابق حرفي دقيق في القاموس
  }
  ```

- **`get_hadith_commentary`** - الحصول على شرح (تعليق) حديث معيّن عبر معرف الحديث مباشرة (وليس معرف الشرح)، بطلب على خطوتين: `/site/hadith/:id` لقراءة `sharhMetadata.id`، ثم `/site/sharh/:id` لجلب الشرح الكامل.

  **Input:** `{ id: string }` — معرف الحديث

  **Output (بدون شرح متاح):** `{ hasCommentary: false }`

  **Output (مع شرح متاح):** `{ hasCommentary: true, ... }` مع كل حقول الشرح الكاملة (`hadith`, `rawi`, `mohdith`, `book`, `numberOrPage`, `grade`, `takhrij`, `sharhMetadata`, ...)

- **`get_hadith_grading_consensus`** - بحث عن عبارة حديثية (بحث `specialist`، مطابقة كل الكلمات `st=w`) وإرجاع كل نتيجة مطابقة كما هي من `dorar.net`، **بترتيب `dorar` نفسه دون أي تجميع أو تصنيف حسب الدرجة**. هذه الأداة استرجاع وترجمة أمينان فقط؛ لا تحسب ولا تُعيد أي حكم بـ"توافق" أو "تعاضد" أو "تواتر" بين النتائج — هذا الاستنتاج متروك بالكامل للقارئ عند مقارنة نص `hadith` والحقول الأخرى بنفسه.

  **Input:**
  ```
  {
    query: string,          // نص البحث (المتن)
    max_results?: number    // الافتراضي 15 — يُقتطع محليًا من نتائج dorar، فلا يوجد معامل "length" فعلي في dorar.net
  }
  ```

  **Output:**
  ```
  {
    totalResults: number,     // عدد النتائج التي أرجعها dorar فعليًا قبل أي اقتطاع بـ max_results
    returnedResults: number,  // عدد النتائج المُضمَّنة فعليًا بعد الاقتطاع
    entries: [
      {
        hadith, rawi, mohdith, book, numberOrPage,
        grade, explainGrade, takhrij, categories, hadithId,
        hasSimilarHadith, hasAlternateHadithSahih, hasUsulHadith, hasSharhMetadata,
        gradeEnglish   // null إذا لم يوجد تطابق حرفي دقيق في القاموس
      },
      ...
    ]
  }
  ```

### Known Limitations

1. This connector depends on dorar.net's live website. If they change their site structure or add stronger anti-bot measures, search/grading tools may need updates — check GitHub Issues if something stops working.

2. On well-known hadiths, Claude may occasionally summarize in its own words instead of showing dorar's full results. If this happens, ask: "Show me the formattedOutput field from the tool's raw response, exactly as returned — do not summarize, reorder, filter, or add commentary. For every {{TRANSLATE: ...}} marker, replace it with an accurate translation, leaving everything else unchanged." This reliably produces the complete, faithful result set.

### Endpoints

يحتوي الـ `API` على مجموعة من الـ `endpoint`

- عندما يبدأ الـ `endpoint` بـ `/api` فهو هكذا يبحث عن طريق الـ `API` الرسمي الخاص بالدرر السنية
- عندما يبدأ الـ `endpoint` بـ `/site` فهو هكذا يبحث عن طريق صفحة البحث الخاص بالدرر السنية
- ردود الـ `site` تحتوي على حقل **`categories`** (التصنيف الموضوعي) لكل حديث: مصفوفة من `{ id, name }` من موقع الدرر

#### /v1/api/hadith/search?value={text}

للبحث عن الأحاديث يعطي `15` نتيجة

شكل الرد كـ `JSON`

```json
{
  "metadata": {
    "length": "عدد نتائج البحث",
    "page": "رقم الصفحة",
    "removeHTML": "هل عناصر الـ HTML ممسوحة أم لا",
    "isCached": "هل هذه النتائج من الـ cache أم لا"
  },
  "data": [
    {
      "hadith": "الحديث",
      "rawi": "الراوي",
      "mohdith": "المحدث",
      "book": "الكتاب",
      "numberOrPage": "رقم الحديث او الصفحة",
      "grade": "درجة الصحة"
    }
  ]
}
```

#### /v1/site/hadith/search?value={text}

للبحث عن الأحاديث يعطي `30` نتيجة

شكل الرد كـ `JSON`

```json
{
  "metadata": {
    "length": "عدد نتائج البحث",
    "page": "رقم الصفحة",
    "removeHTML": "هل عناصر الـ HTML ممسوحة أم لا",
    "specialist": "نوع الاحاديث هل هي للمتخصصين أم لا",
    "numberOfNonSpecialist": "عدد الأحاديث لغير المتخصصين",
    "numberOfSpecialist": "عدد الأحاديث للمتخصصين",
    "isCached": "هل هذه النتائج من الـ cache أم لا"
  },
  "data": [
    {
      "hadith": "الحديث",
      "rawi": "الراوي",
      "mohdith": "المحدث",
      "mohdithId": "رقم المحدث",
      "book": "الكتاب",
      "bookId": "رقم الكتاب",
      "numberOrPage": "رقم الحديث او الصفحة",
      "grade": "درجة الصحة",
      "explainGrade": "توضيح درجة الصحة",
      "takhrij": "تخريج الحديث في كتب أخرى",
      "hadithId": "رقم الحديث لاستخدامه في البحث عن الأحاديث البديلة أو الحديث البديل الصحيح",
      "categories": [
        {
          "id": "رقم التصنيف",
          "name": "اسم التصنيف"
        }
      ],
      "hasSimilarHadith": "هل الحديث له أحاديث مشابهة أم لا",
      "hasAlternateHadithSahih": "هل الحديث له حديث صحيح بديل أم لا",
      "hasUsulHadith": "هل الحديث له أصول أم لا",
      "similarHadithDorar": "رابط الأحاديث المشابهة في موقع الدرر",
      "alternateHadithSahihDorar": "رابط الحديث الصحيح في موقع الدرر",
      "usulHadithDorar": "رابط أصول الحديث في موقع الدرر",
      "urlToGetSimilarHadith": "رابط لكي تبحث عن الأحاديث المشابهة",
      "urlToGetAlternateHadithSahih": "رابط لكي تبحث عن الحديث الصحيح",
      "urlToGetUsulHadith": "رابط لكي تبحث عن أصول الحديث",
      "hasSharhMetadata": "هل الحديث له شرح أم لا",
      "sharhMetadata": {
        "id": "رقم الشرح",
        "isContainSharh": "هل يحتوى هذا الرد على شرح الحديث أم لا؟",
        "urlToGetSharh": "رابط لكي تبحث عن شرح الحديث"
      }
    }
  ]
}
```

#### /v1/site/hadith/similar/:id

يحضر لك أحاديث مشابهة المقابلة للـ `id`

شكل الرد كـ `JSON`

```json
{
  "metadata": {
    "length": "عدد نتائج البحث",
    "isCached": "هل هذه النتائج من الـ cache أم لا"
  },
  "data": [
    {
      "hadith": "الحديث",
      "rawi": "الراوي",
      "mohdith": "المحدث",
      "mohdithId": "رقم المحدث",
      "book": "الكتاب",
      "bookId": "رقم الكتاب",
      "numberOrPage": "رقم الحديث او الصفحة",
      "grade": "درجة الصحة",
      "explainGrade": "توضيح درجة الصحة",
      "hadithId": "رقم الحديث لاستخدامه في البحث عن الأحاديث البديلة أو الحديث البديل الصحيح",
      "categories": [
        {
          "id": "رقم التصنيف",
          "name": "اسم التصنيف"
        }
      ],
      "hasSimilarHadith": "هل الحديث له أحاديث مشابهة أم لا",
      "hasAlternateHadithSahih": "هل الحديث له حديث صحيح بديل أم لا",
      "hasUsulHadith": "هل الحديث له أصول أم لا",
      "similarHadithDorar": "رابط الأحاديث المشابهة في موقع الدرر",
      "alternateHadithSahihDorar": "رابط الحديث الصحيح في موقع الدرر",
      "usulHadithDorar": "رابط أصول الحديث في موقع الدرر",
      "urlToGetSimilarHadith": "رابط لكي تبحث عن الأحاديث المشابهة",
      "urlToGetAlternateHadithSahih": "رابط لكي تبحث عن الحديث الصحيح",
      "urlToGetUsulHadith": "رابط لكي تبحث عن أصول الحديث",
      "hasSharhMetadata": "هل الحديث له شرح أم لا",
      "sharhMetadata": {
        "id": "رقم الشرح",
        "isContainSharh": "هل يحتوى هذا الرد على شرح الحديث أم لا؟",
        "urlToGetSharh": "رابط لكي تبحث عن شرح الحديث"
      }
    }
  ]
}
```

#### /v1/site/hadith/:id

يحضر لك الحديث المقابل للـ `id`

شكل الرد كـ `JSON`

```json
{
  "metadata": {
    "isCached": "هل هذه النتائج من الـ cache أم لا"
  },
  "data": {
    "hadith": "الحديث",
    "rawi": "الراوي",
    "mohdith": "المحدث",
    "mohdithId": "رقم المحدث",
    "book": "الكتاب",
    "bookId": "رقم الكتاب",
    "numberOrPage": "رقم الحديث او الصفحة",
    "grade": "درجة الصحة",
    "explainGrade": "توضيح درجة الصحة",
    "hadithId": "رقم الحديث لاستخدامه في البحث عن الأحاديث البديلة أو الحديث البديل الصحيح",
    "categories": [
      {
        "id": "رقم التصنيف",
        "name": "اسم التصنيف"
      }
    ],
    "hasSimilarHadith": "هل الحديث له أحاديث مشابهة أم لا",
    "hasAlternateHadithSahih": "هل الحديث له حديث صحيح بديل أم لا",
    "hasUsulHadith": "هل الحديث له أصول أم لا",
    "similarHadithDorar": "رابط الأحاديث المشابهة في موقع الدرر",
    "alternateHadithSahihDorar": "رابط الحديث الصحيح في موقع الدرر",
    "usulHadithDorar": "رابط أصول الحديث في موقع الدرر",
    "urlToGetSimilarHadith": "رابط لكي تبحث عن الأحاديث المشابهة",
    "urlToGetAlternateHadithSahih": "رابط لكي تبحث عن الحديث الصحيح",
    "urlToGetUsulHadith": "رابط لكي تبحث عن أصول الحديث",
    "hasSharhMetadata": "هل الحديث له شرح أم لا",
    "sharhMetadata": {
      "id": "رقم الشرح",
      "isContainSharh": "هل يحتوى هذا الرد على شرح الحديث أم لا؟",
      "urlToGetSharh": "رابط لكي تبحث عن شرح الحديث"
    }
  }
}
```

#### /v1/site/hadith/alternate/:id

يحضر لك الحديث الصحيح المقابل للـ `id`

شكل الرد كـ `JSON`

```json
{
  "metadata": {
    "isCached": "هل هذه النتائج من الـ cache أم لا"
  },
  "data": {
    "hadith": "الحديث",
    "rawi": "الراوي",
    "mohdith": "المحدث",
    "mohdithId": "رقم المحدث",
    "book": "الكتاب",
    "bookId": "رقم الكتاب",
    "numberOrPage": "رقم الحديث او الصفحة",
    "grade": "درجة الصحة",
    "hadithId": "رقم الحديث لاستخدامه في البحث عن الأحاديث البديلة أو الحديث البديل الصحيح",
    "categories": [
      {
        "id": "رقم التصنيف",
        "name": "اسم التصنيف"
      }
    ],
    "hasSimilarHadith": "هل الحديث له أحاديث مشابهة أم لا",
    "hasAlternateHadithSahih": "هل الحديث له حديث صحيح بديل أم لا",
    "similarHadithDorar": "رابط الأحاديث المشابهة في موقع الدرر",
    "urlToGetSimilarHadith": "رابط لكي تبحث عن الأحاديث المشابهة",
    "hasSharhMetadata": "هل الحديث له شرح أم لا",
    "sharhMetadata": {
      "id": "رقم الشرح",
      "isContainSharh": "هل يحتوى هذا الرد على شرح الحديث أم لا؟",
      "urlToGetSharh": "رابط لكي تبحث عن شرح الحديث"
    }
  }
}
```

#### /v1/site/hadith/usul/:id

يحضر لك أصول الحديث وطرق إخراجه للـ `id` المعطى

شكل الرد كـ `JSON`

```json
{
  "metadata": {
    "isCached": "هل هذه النتائج من الـ cache أم لا"
  },
  "data": {
    "hadith": "الحديث الأساسي",
    "rawi": "الراوي",
    "mohdith": "المحدث",
    "mohdithId": "رقم المحدث",
    "book": "الكتاب",
    "bookId": "رقم الكتاب",
    "numberOrPage": "رقم الحديث او الصفحة",
    "grade": "درجة الصحة",
    "explainGrade": "توضيح درجة الصحة",
    "hadithId": "رقم الحديث",
    "categories": [
      {
        "id": "رقم التصنيف",
        "name": "اسم التصنيف"
      }
    ],
    "hasSimilarHadith": "هل الحديث له أحاديث مشابهة أم لا",
    "hasAlternateHadithSahih": "هل الحديث له حديث صحيح بديل أم لا",
    "hasUsulHadith": "هل الحديث له أصول أم لا",
    "usulHadith": {
      "sources": [
        {
          "source": "مصدر الحديث مع الصفحة",
          "chain": "سلسلة الرواة",
          "hadithText": "نص الحديث"
        }
      ],
      "count": "عدد المصادر"
    }
  }
}
```

#### /v1/site/sharh/:id

للبحث عن شرح لحديث واحد عن طريق الـ `id`

شكل الرد كـ `JSON`

```json
{
  "metadata": {
    "isCached": "هل هذه النتائج من الـ cache أم لا"
  },
  "data": {
    "hadith": "الحديث",
    "rawi": "الراوي",
    "mohdith": "المحدث",
    "book": "الكتاب",
    "numberOrPage": "رقم الحديث او الصفحة",
    "grade": "درجة الصحة",
    "takhrij": "تخريج الحديث في كتب أخرى",
    "hasSharhMetadata": "هل الحديث له شرح أم لا",
    "sharhMetadata": {
      "id": "رقم الشرح",
      "isContainSharh": "هل يحتوى هذا الرد على شرح الحديث أم لا؟",
      "urlToGetSharh": "رابط لكي تبحث عن شرح الحديث",
      "sharh": "شرح الحديث"
    }
  }
}
```

#### /v1/site/sharh/text/:text

للبحث عن شرح لحديث واحد عن طريقة النص المعطى

شكل الرد كـ `JSON`

```json
{
  "metadata": {
    "specialist": "نوع الاحاديث هل هي للمتخصصين أم لا",
    "isCached": "هل هذه النتائج من الـ cache أم لا"
  },
  "data": {
    "hadith": "الحديث",
    "rawi": "الراوي",
    "mohdith": "المحدث",
    "book": "الكتاب",
    "numberOrPage": "رقم الحديث او الصفحة",
    "grade": "درجة الصحة",
    "takhrij": "تخريج الحديث في كتب أخرى",
    "hasSharhMetadata": "هل الحديث له شرح أم لا",
    "sharhMetadata": {
      "id": "رقم الشرح",
      "isContainSharh": "هل يحتوى هذا الرد على شرح الحديث أم لا؟",
      "urlToGetSharh": "رابط لكي تبحث عن شرح الحديث",
      "sharh": "شرح الحديث"
    }
  }
}
```

#### /v1/site/sharh/search?value={text}

للبحث عن شرح للأحاديث يعطي `30` نتيجة

شكل الرد كـ `JSON`

```json
{
  "metadata": {
    "length": "عدد نتائج البحث",
    "page": "رقم الصفحة",
    "removeHTML": "هل عناصر الـ HTML ممسوحة أم لا",
    "specialist": "نوع الاحاديث هل هي للمتخصصين أم لا",
    "isCached": "هل هذه النتائج من الـ cache أم لا"
  },
  "data": [
    {
      "hadith": "الحديث",
      "rawi": "الراوي",
      "mohdith": "المحدث",
      "book": "الكتاب",
      "numberOrPage": "رقم الحديث او الصفحة",
      "grade": "درجة الصحة",
      "takhrij": "تخريج الحديث في كتب أخرى",
      "hasSharhMetadata": "هل الحديث له شرح أم لا",
      "sharhMetadata": {
        "id": "رقم الشرح",
        "isContainSharh": "هل يحتوى هذا الرد على شرح الحديث أم لا؟",
        "urlToGetSharh": "رابط لكي تبحث عن شرح الحديث",
        "sharh": "شرح الحديث"
      }
    }
  ]
}
```

#### /v1/site/mohdith/:id

للبحث عن معلومات عن المحدث عن طريق الـ `id`

شكل الرد كـ `JSON`

```json
{
  "metadata": {
    "isCached": "هل هذه النتائج من الـ cache أم لا"
  },
  "data": {
    "name": "المحدث",
    "mohdithId": "رقم المحدث",
    "info": "معلومات عن المحدث"
  }
}
```

#### /v1/site/book/:id

للبحث عن معلومات عن الكتاب عن طريق الـ `id`

شكل الرد كـ `JSON`

```json
{
  "metadata": {
    "isCached": "هل هذه النتائج من الـ cache أم لا"
  },
  "data": {
    "name": "الكتاب",
    "bookId": "رقم الكتاب",
    "author": "المؤلف",
    "reviewer": "المراجع",
    "publisher": "دار النشر",
    "edition": "رقم الطبعة",
    "editionYear": "سنة الطبعة"
  }
}
```

### Query

عناصر الـ `query` التي يمكنك استخدامها  
مع شرح تفصيلي أسفل الجدول

<div dir=rtl>

|              key               |                      الوصف                      |
| :----------------------------: | :---------------------------------------------: |
|            `value`             |      وهي محتوى نص الحديث المراد البحث عنه       |
|             `page`             |            لتحديد الصفحة التي تريدها            |
|          `removehtml`          |         حذف عناصر الـ `HTML` في الحديث          |
|          `specialist`          | تستخدم لتحدد نوع الاحاديث هل هي للمتخصصين أم لا |
|            `xclude`            |      كلمة أو جملة تريد استبعادها من البحث       |
|              `st`              |                تحدد طريقة البحث                 |
|              `t`               |                تحديد نطاق البحث                 |
|  <span dir=ltr >`d[]`</span>   |       تحديد درجة الحديث سواء صحيح ام ضعيف       |
|  <span dir=ltr >`m[]`</span>   |        تحديد اسماء المحدثين التي تريدهم         |
|  <span dir=ltr >`s[]`</span>   |        تحديد الكتب التي تريد البحث فيها         |
| <span dir=ltr >`rawi[]`</span> |         تحديد اسماء الرواة التي تريدهم          |

 </div>

- هذه الاقواس `[]` تفيد ان هذا العنصر يقبل اكثر من اختيار

#### value

- محتوى نص الحديث المراد البحث عنه
- مثال: `/v1/api/hadith/search?value=جملة البحث`  
   هكذا سيبحث بناءًا على جملة البحث

#### page

- لتحديد الصفحة التي تريدها
- مثال: `/v1/api/hadith/search?value=جملة البحث&page=1`  
  هكذا سيبحث في نتائج البحث للصفحة الثالثة أي المجموعة الثالثة لنتائج البحث
- القيمة الافتراضية ستكون الصفحة رقم واحد `page=1`

#### removehtml

- حذف عناصر الـ `HTML` في الحديث  
  مثل `<span class="search-keys">...</span>`
- مثال: `/v1/api/hadith/search?value=جملة البحث&removehtml=true`  
  هكذا سيمسح عناصر الـ `HTML` من نتائج البحث
- القيمة الافتراضي هي `true`

#### specialist

- تستخدم لتحدد نوع الاحاديث هل هي للمتخصصين أم لا
- قيمها هي `true` للمتخصصين و `false` لغير المتخصصين
- مثال: `/v1/api/hadith/search?value=جملة البحث&specialist=true`  
  سيعطيك أحاديث أكثر ومختلفة خاصة للمتخصصين  
  وتكون بها معلومة اضافية مثل تخريج الأحاديث في الكتب الأخرى
- القيمة الافتراضية هي `false`

#### xclude

- كلمة أو جملة تريد استبعادها من البحث مثال
- مثال: `/v1/api/hadith/search?value=جملة البحث&xclude=اليهود`  
  هكذا سيستبعد كلمة `اليهود` من البحث

#### st

- تحدد طريقة البحث بثلاثة خيارات فقط
- هذه الطرق هي: `جميع الكلمات`، `أي كلمة`، `بحث مطابق`
- قيمها هي: `w`, `a`, `p`  
  للبحث بـ `جميع الكلمات` فستكون `st=w`  
  للبحث بـ `أي كلمة` فستكون `st=a`  
  للبحث بـ `بحث مطابق` فستكون `st=p`
- مثال: `/v1/api/hadith/search?value=جملة البحث&st=p`  
   هكذا سيبحث بشكل مطابق لجملة البحث

[كل القيم وطرق البحث التي تمثلها](./data/method-search.txt)  
أو يمكنك الحصول عليها كملف `JSON` من [هنا](./data/method-search.json)

#### t

- تحديد نطاق البحث
- هذه النطاقات هي: `جميع الأحاديث`، `الأحاديث المرفوعة`، `الأحاديث القدسية`، `آثار الصحابة`، `شروح الأحاديث`
- قيمها هي: `*`, `0`, `1`, `2`, `3`  
  للبحث عن `جميع الأحاديث` فستكون `t=*`  
  للبحث عن `الأحاديث المرفوعة` فستكون `t=0`  
  للبحث عن `الأحاديث القدسية` فستكون `t=1`  
  للبحث عن `آثار الصحابة` فستكون `t=2`  
  للبحث عن `شروح الأحاديث` فستكون `t=3`
- مثال: `/v1/api/hadith/search?value=جملة البحث&t=1`  
  هكذا سيبحث فقط عن الأحاديث القدسية المطابق لجملة البحث

[كل القيم ونطاقات البحث التي تمثلها](./data/zone-search.txt)  
أو يمكنك الحصول عليها كملف `JSON` من [هنا](./data/zone-search.json)

#### d[]

- تحديد درجة الحديث سواء صحيح ام ضعيف
- قيمها هي: `0`، `1`، `2`، `3`، `4`  
  للبحث عن `جميع الدرجات` فستكون `d[]=0`  
  للبحث عن `أحاديث حكم المحدثون عليها بالصحة` فستكون `d[]=1`  
  للبحث عن `أحاديث حكم المحدثون على أسانيدها بالصحة` فستكون `d[]=2`  
  للبحث عن `أحاديث حكم المحدثون عليها بالضعف` فستكون `d[]=3`  
  للبحث عن `أحاديث حكم المحدثون على أسانيدها بالضعف` فستكون `d[]=4`
- مثال: `/v1/api/hadith/search?value=جملة البحث&d[]=3`  
  هكذا سيبحث فقط عن الأحاديث المحكوم عليها بالضعف
- يمكنك تحديد اكثر من اختيار  
  مثال: `/v1/api/hadith/search?value=جملة البحث&d[]=1&d[]=2`  
  هكذا سيبحث فقط عن الأحاديث المحكوم عليها بالصحة من ناحية المتن و الاسناد

[كل القيم والدرجات التي تمثلها](./data/degree.txt)  
أو يمكنك الحصول عليها كملف `JSON` من [هنا](./data/degree.json)

#### m[]

- تحديد اسماء المحدثين التي تريدهم
- قيمها متعددة ومنها: `0`، `179`، `204`، `256`، `261` ... إلخ  
  حيث `0` تمثل `جميع المحدثين`  
  و`179` تمثل `الإمام المالك`  
  و`204` تمثل `الإمام الشافعي`  
  و`256` تمثل `البخاري`  
  و`261` تمثل `مسلم`
- مثال: `/v1/api/hadith/search?value=جملة البحث&m[]=179`  
  هكذا سيبحث فقط عن الأحاديث التي حدث بها الإمام مالك
- يمكنك تحديد اكثر من اختيار  
  مثال: `/v1/api/hadith/search?value=جملة البحث&m[]=256&m[]=261`  
  هكذا سيبحث فقط عن الأحاديث التي حدثا بها بخاري ومسلم

[كل القيم وأسماء المحدثين التي تمثلها](./data/mohdith.txt)  
أو يمكنك الحصول عليها كملف `JSON` من [هنا](./data/mohdith.json)

#### s[]

- تحديد الكتب التي تريد البحث فيها
- قيمها متعددة ومنها: `0`، `13457`، `6216`، `3088`، `96` ... إلخ  
  حيث `0` تمثل `جميع المحدثين`
  و`13457` تمثل `الأربعون النووية`  
  و`6216` تمثل `صحيح البخاري`  
  و`3088` تمثل `صحيح مسلم`  
  و`96` تمثل `الصحيح المسند`
- مثال: `/v1/api/hadith/search?value=جملة البحث&s[]=96`  
  هكذا سيبحث فقط عن الأحاديث الواردة في كتاب الصحيح المسند
- يمكنك تحديد اكثر من اختيار  
  مثال: `/v1/api/hadith/search?value=جملة البحث&s[]=6216&s[]=13457`  
  هكذا سيبحث فقط عن الأحاديث التي وردت في كتابي الأربعون النووية وكتاب صحيح البخاري

[كل القيم وأسماء الكتب التي تمثلها](./data/book.txt)  
أو يمكنك الحصول عليها كملف `JSON` من [هنا](./data/book.json)

#### rawi[]

- تحديد اسماء الرواة التي تريدهم
- قيمها متعددة ومنها: `0`،`1819`، `8918`، `2664` ... إلخ  
  حيث `0` تمثل `جميع الرواة`  
  حيث `1819` تمثل `أسماء بنت أبي بكر`  
  و`8918` تمثل `عمر بن الخطاب`  
  و`2664` تمثل `ابن عباس`
- مثال: `/v1/api/hadith/search?value=جملة البحث&rawi[]=1819`  
  هكذا سيبحث فقط عن الأحاديث التي رواتها أسماء بنت أبي بكر
- يمكنك تحديد اكثر من اختيار  
  مثال: `/v1/api/hadith/search?value=جملة البحث&rawi[]=8918&rawi[]=2664`  
  هكذا سيبحث فقط عن الأحاديث التي رواها عمر بن الخطاب وابن عباس
- هنا قيم ترمز لأكثر من شخص في آن واحد  
  مثل `2665` ترمز لـ `ابن عباس أو أبو هريرة`  
  و`8924` ترمز لـ `عمر بن الخطاب وأبو هريرة`  
  و`264` ترمز لـ `أبو الدرداء وأبو أمامة وعبدالله بن عمر وابن عباس وجابر بن عبدالله`

[كل القيم وأسماء الرواة التي تمثلها](./data/rawi.txt)  
أو يمكنك الحصول عليها كملف `JSON` من [هنا](./data/rawi.json)

### Data

كل البيانات المتاحة والقيم التي تمثلها يمكنكم الحصول عليه من هذه الـ `endpoints`

```json
[
  {
    "endpoint": "/v1/data/book",
    "description": "احضار كل الكتب المتاحة",
    "abstractResponse": [
      {
        "key": "الكلمة  المفتاحية",
        "value": "القيمة"
      }
    ]
  },
  {
    "endpoint": "/v1/data/degree",
    "description": "احضار كل درجات الحديث المتاحة",
    "abstractResponse": [
      {
        "key": "الكلمة  المفتاحية",
        "value": "القيمة"
      }
    ]
  },
  {
    "endpoint": "/v1/data/methodSearch",
    "description": "احضار كل طرق البحث المتاحة",
    "abstractResponse": [
      {
        "key": "الكلمة  المفتاحية",
        "value": "القيمة"
      }
    ]
  },
  {
    "endpoint": "/v1/data/mohdith",
    "description": "احضار كل المحدثين المتاحين",
    "abstractResponse": [
      {
        "key": "الكلمة  المفتاحية",
        "value": "القيمة"
      }
    ]
  },
  {
    "endpoint": "/v1/data/rawi",
    "description": "احضار كل الرواة المتاحين",
    "abstractResponse": [
      {
        "key": "الكلمة  المفتاحية",
        "value": "القيمة"
      }
    ]
  },
  {
    "endpoint": "/v1/data/zoneSearch",
    "description": "احضار كل نطاقات البحث المتاحة",
    "abstractResponse": [
      {
        "key": "الكلمة  المفتاحية",
        "value": "القيمة"
      }
    ]
  }
]
```

## توجد مشكلة أو لديك اقتراح؟

افتح issue إذا قابلت مشكلة ما او لديك اقتراح

## المساهمة

بالطبع نرحب بأي مساهمة لدينا ❤
