import { NextRequest, NextResponse } from 'next/server';
import { processUserText, formatDataForAI } from '../../../lib/keywordDetector';
import { testConnection } from '@/lib/database';

// پرامپت سیستم بهبود یافته
const SYSTEM_PROMPT = `تو رابین هستی، دستیار هوشمند شرکت رابین. توسط احمدرضا آوندی توسعه داده شدی و مدیر عامل شرکت مهندس کریمی هست.

## شخصیت و نحوه صحبت:
- صمیمی، دوستانه و غیررسمی صحبت کن
- همیشه به زبان فارسی پاسخ بده
- پاسخ‌ها رو کوتاه، مفید و قابل فهم نگه دار
- فقط در اولین مکالمه سلام کن، بعدش مستقیم جواب بده
- اگر اسم کاربر رو نمی‌دونی، بپرس

## دسترسی‌های تو:
- اطلاعات کامل همکاران، مشتریان و فعالیت‌های شرکت
- گزارشات فروش، معاملات و درآمد
- وظایف و پروژه‌های در حال انجام
- بازخوردهای مشتریان و نظرسنجی‌ها
- رویدادهای تقویم و جلسات
- اسناد و مدارک شرکت
- گزارشات روزانه همکاران

    باید تا جایی که میشه به همه سوالات پاسخ بدی چون تیم فروش و مدیرعامل به تو دسترسی دارند

## نحوه استفاده از داده‌های سیستم:
وقتی اطلاعات سیستم در پیام کاربر موجود باشه (بین [اطلاعات سیستم: ...]):
1. این داده‌ها رو به عنوان منبع اصلی اطلاعات استفاده کن
2. داده‌ها رو تحلیل کن و خلاصه مفیدی ارائه بده
3. اگر داده خاصی نیست، بگو که اطلاعاتی یافت نشد
4. عددها رو با کاما فرمت کن (مثل 1,250,000)
5. اسامی و جزئیات مهم رو ذکر کن

همیشه آماده کمک و راهنمایی هستی!`;

// Environment configuration
const AI_CONFIG = {
  OPENROUTER_API_KEY: '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',
  OPENROUTER_MODEL: 'openai/gpt-3.5-turbo'
};

// تابع فراخوانی OpenRouter API
async function callOpenRouter(messages: any[]) {
  try {
    console.log('🤖 Calling OpenRouter API...');

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AI_CONFIG.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://localhost:3000',
        'X-Title': 'Dastyar Robin'
      },
      body: JSON.stringify({
        model: AI_CONFIG.OPENROUTER_MODEL,
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    console.log('📡 OpenRouter response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenRouter error response:', errorText);
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ OpenRouter response received');

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from OpenRouter');
    }

    return data.choices[0].message.content;
  } catch (error: any) {
    console.error('❌ OpenRouter API Error:', error.message);
    throw new Error('خطا در برقراری ارتباط با هوش مصنوعی: ' + error.message);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userMessage, history = [] } = await request.json();

    if (!userMessage) {
      return NextResponse.json({ error: 'پیام کاربر الزامی است' }, { status: 400 });
    }

    console.log('🎯 AI Request received:', userMessage);

    // تست اتصال دیتابیس
    const dbConnected = await testConnection();
    let enrichmentResult: any = { hasKeywords: false };
    let messageToProcess = userMessage;
    let hasSystemData = false;

    if (dbConnected) {
      console.log('✅ Database connected, processing keywords...');

      // پردازش متن و دریافت داده‌ها
      enrichmentResult = await processUserText(userMessage);

      if (enrichmentResult.hasKeywords && enrichmentResult.successfulQueries > 0) {
        console.log(`📊 Data enrichment successful: ${enrichmentResult.successfulQueries} queries`);

        // فرمت کردن داده‌ها برای AI
        const formattedData = formatDataForAI(enrichmentResult.results);
        messageToProcess = `${userMessage}\n\n[اطلاعات سیستم:\n${formattedData}]`;
        hasSystemData = true;

        console.log('📋 Message enriched with database context');
      } else {
        console.log('ℹ️ No relevant data found or no keywords detected');
      }
    } else {
      console.warn('⚠️ Database connection failed, proceeding without data enrichment');
    }

    // ساخت پیام‌ها برای AI
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.flatMap((h: any) => [
        { role: 'user', content: h.user },
        { role: 'assistant', content: h.robin }
      ]),
      { role: 'user', content: messageToProcess }
    ];

    // فراخوانی AI
    const aiResponse = await callOpenRouter(messages);

    console.log('✅ AI Response generated');

    return NextResponse.json({
      response: aiResponse,
      intent: null,
      actionExecuted: enrichmentResult.hasKeywords,
      hasSystemData: hasSystemData,
      originalMessage: userMessage,
      enrichedMessage: hasSystemData ? messageToProcess : null,
      databaseData: enrichmentResult,
      processingInfo: {
        keywordsFound: enrichmentResult.keywordsFound || 0,
        successfulQueries: enrichmentResult.successfulQueries || 0,
        failedQueries: enrichmentResult.failedQueries || 0
      }
    });

  } catch (error: any) {
    console.error('❌ AI API Error:', error.message);
    console.error('❌ Full error:', error);

    return NextResponse.json({
      response: 'متأسفم، مشکلی در پردازش درخواست شما پیش آمد. لطفاً دوباره تلاش کنید.',
      intent: null,
      actionExecuted: false,
      hasSystemData: false,
      error: error.message
    }, { status: 500 });
  }
}