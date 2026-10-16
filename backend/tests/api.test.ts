import assert from 'assert';
import { addOneCalendarMonth, SubscriptionService } from '../src/services/subscriptionService';
import { db } from '../src/db/database';
import { PaperGeneratorService } from '../src/services/paperGeneratorService';
import { PdfService } from '../src/services/pdfService';
import { User, PaperGenerationConfig } from '../src/types';

async function runTests() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING QPG AUTOMATED TEST SUITE');
  console.log('======================================================\n');

  // ----------------------------------------------------
  // TEST 1: Calendar Month Expiry Calculation (Requirement 14)
  // ----------------------------------------------------
  console.log('[Test 1] Verifying Calendar Month Expiry Calculation...');
  {
    // Case A: Jan 31, 2026 -> should expire Feb 28, 2026
    const jan31 = new Date(2026, 0, 31, 10, 0, 0);
    const febExpiry = addOneCalendarMonth(jan31);
    assert.strictEqual(febExpiry.getFullYear(), 2026);
    assert.strictEqual(febExpiry.getMonth(), 1); // February (0-indexed)
    assert.strictEqual(febExpiry.getDate(), 28);
    console.log('  ✓ Jan 31, 2026 -> Feb 28, 2026 correctly handled');

    // Case B: March 31, 2026 -> should expire April 30, 2026
    const mar31 = new Date(2026, 2, 31, 15, 30, 0);
    const aprExpiry = addOneCalendarMonth(mar31);
    assert.strictEqual(aprExpiry.getMonth(), 3); // April
    assert.strictEqual(aprExpiry.getDate(), 30);
    console.log('  ✓ March 31, 2026 -> April 30, 2026 correctly handled');

    // Case C: Dec 15, 2026 -> should expire Jan 15, 2027 (Year rollover)
    const dec15 = new Date(2026, 11, 15, 12, 0, 0);
    const jan27Expiry = addOneCalendarMonth(dec15);
    assert.strictEqual(jan27Expiry.getFullYear(), 2027);
    assert.strictEqual(jan27Expiry.getMonth(), 0); // January
    assert.strictEqual(jan27Expiry.getDate(), 15);
    console.log('  ✓ Dec 15, 2026 -> Jan 15, 2027 year-rollover correctly handled');
  }

  // ----------------------------------------------------
  // TEST 2: Teacher Profile & Subject Locking (User Requirement)
  // ----------------------------------------------------
  console.log('\n[Test 2] Verifying Teacher Subject Locking...');
  let chemTeacher: User;
  {
    const email = `test.chem.${Date.now()}@qpg.edu`;
    chemTeacher = {
      id: 'usr_chem_' + Date.now(),
      email,
      name: 'Dr. Chemistry Teacher',
      institution: 'National Science Academy',
      subject: 'Chemistry',
      role: 'teacher',
      created_at: new Date().toISOString(),
    };
    await db.createUser(chemTeacher);

    const retrieved = db.getUserById(chemTeacher.id);
    assert.ok(retrieved);
    assert.strictEqual(retrieved?.subject, 'Chemistry');
    console.log(`  ✓ Teacher registered with locked specialization: ${retrieved?.subject}`);

    // Verify duplicate email is prohibited
    await assert.rejects(async () => {
      await db.createUser({ ...chemTeacher, id: 'usr_dup' });
    }, /already exists/);
    console.log('  ✓ Duplicate email registration prohibited');
  }

  // ----------------------------------------------------
  // TEST 3: Subscription Status & Initial Inactive State
  // ----------------------------------------------------
  console.log('\n[Test 3] Verifying Subscription Enforcement on Inactive User...');
  {
    const status = SubscriptionService.getStatus(chemTeacher.id);
    assert.strictEqual(status.isActive, false);
    assert.strictEqual(status.status, 'none');
    console.log('  ✓ Inactive user correctly flagged (access locked)');
  }

  // ----------------------------------------------------
  // TEST 4: UPI Payment Submission & Duplicate UTR Prevention
  // ----------------------------------------------------
  console.log('\n[Test 4] Verifying UPI Payment Submission & Duplicate UTR Prevention...');
  const testUtr = '9876543210' + Math.floor(10 + Math.random() * 89);
  let payReq: any;
  {
    payReq = await SubscriptionService.submitPaymentRequest(
      chemTeacher.id,
      testUtr,
      new Date().toISOString(),
      'Paid via GPay ₹299'
    );
    assert.strictEqual(payReq.status, 'pending');
    assert.strictEqual(payReq.amount, 299);
    assert.strictEqual(payReq.utr, testUtr);
    console.log(`  ✓ Payment request submitted with status: ${payReq.status}, UTR: ${payReq.utr}`);

    // Verify duplicate UTR is rejected
    await assert.rejects(async () => {
      await SubscriptionService.submitPaymentRequest(chemTeacher.id, testUtr, new Date().toISOString());
    }, /already been submitted/);
    console.log('  ✓ Duplicate UTR submission prevented');
  }

  // ----------------------------------------------------
  // TEST 5: Admin Payment Approval & 1-Month Activation
  // ----------------------------------------------------
  console.log('\n[Test 5] Verifying Admin Payment Approval Workflow...');
  {
    const approval = await SubscriptionService.approvePayment(payReq.id, 'admin@qpg.com');
    assert.strictEqual(approval.payment.status, 'approved');
    assert.strictEqual(approval.subscription.status, 'active');
    assert.ok(approval.subscription.expires_at);

    // Verify status is now active
    const activeStatus = SubscriptionService.getStatus(chemTeacher.id);
    assert.strictEqual(activeStatus.isActive, true);
    assert.strictEqual(activeStatus.status, 'active');
    assert.ok(activeStatus.daysRemaining >= 28);
    console.log(`  ✓ Payment approved! Subscription active for 1 month (${activeStatus.formattedExpiry})`);
  }

  // ----------------------------------------------------
  // TEST 6: Real Question Paper Generation (2026 Examination Patterns)
  // ----------------------------------------------------
  console.log('\n[Test 6] Verifying 2026 Examination Paper Generation...');
  {
    // A: 2026 NEET Chemistry Pattern (Section A 35 + Section B 15 = 50 Qs, 180 Marks)
    console.log('  Testing 2026 NEET Chemistry Paper Generation...');
    const neetConfig: PaperGenerationConfig = {
      title: 'NEET 2026 Chemistry Model Examination',
      institution_name: 'Apex Medical Academy',
      exam_type: 'NEET',
      subject: 'Chemistry',
      class_levels: ['11', '12'],
      chapters: [], // full syllabus
      total_questions: 50,
      duration_minutes: 50,
      marks_per_question: 4,
      negative_marking: 1,
      include_answer_key: true,
      include_solutions: true,
    };

    const neetPaper = await PaperGeneratorService.generatePaper(chemTeacher.id, neetConfig);
    assert.strictEqual(neetPaper.subject, 'Chemistry');
    assert.strictEqual(neetPaper.exam_type, 'NEET');
    assert.strictEqual(neetPaper.total_marks, 180);
    assert.strictEqual(neetPaper.sections.length, 2);
    assert.strictEqual(neetPaper.sections[0].questions.length, 35); // Sec A: 35
    assert.strictEqual(neetPaper.sections[1].questions.length, 15); // Sec B: 15
    assert.strictEqual(neetPaper.all_questions.length, 50);
    assert.strictEqual(neetPaper.answer_key.length, 50);
    console.log('    ✓ 2026 NEET Paper generated with exactly 50 questions (35 Sec A + 15 Sec B, 180 marks)');

    // Verify no duplicate question IDs
    const qIds = neetPaper.all_questions.map((q) => q.id);
    const uniqueQIds = new Set(qIds);
    assert.strictEqual(uniqueQIds.size, 50);
    console.log('    ✓ Duplicate prevention verified: 50/50 unique questions');

    // B: 2026 CET Chemistry Pattern (60 MCQs, 60 Marks, 80 Minutes, 0 Negative Marking)
    console.log('  Testing 2026 CET Chemistry Paper Generation...');
    const cetConfig: PaperGenerationConfig = {
      title: 'KCET 2026 Chemistry Full Mock Test',
      institution_name: 'Karnataka Pre-University Council',
      exam_type: 'CET',
      subject: 'Chemistry',
      class_levels: ['11', '12'],
      chapters: [],
      total_questions: 60,
      duration_minutes: 80,
      marks_per_question: 1,
      negative_marking: 0,
      include_answer_key: true,
      include_solutions: false,
    };

    const cetPaper = await PaperGeneratorService.generatePaper(chemTeacher.id, cetConfig);
    assert.strictEqual(cetPaper.total_marks, 60);
    assert.strictEqual(cetPaper.all_questions.length, 60);
    assert.strictEqual(cetPaper.duration_minutes, 80);
    console.log('    ✓ 2026 CET Paper generated with exactly 60 questions (60 marks, 80 mins, 0 neg mark)');
  }

  // ----------------------------------------------------
  // TEST 7: PDF Publication HTML & KaTeX / Diagram Formatting
  // ----------------------------------------------------
  console.log('\n[Test 7] Verifying PDF Publication HTML Template Generation...');
  {
    const samplePaper = await PaperGeneratorService.generatePaper(chemTeacher.id, {
      title: 'Unit Test I',
      institution_name: 'Excellence Academy',
      exam_type: 'CUSTOM',
      subject: 'Chemistry',
      class_levels: ['11'],
      chapters: [],
      total_questions: 5,
      duration_minutes: 30,
      marks_per_question: 4,
      negative_marking: 1,
      include_answer_key: true,
      include_solutions: true,
    });

    const html = PdfService.generatePaperHtml(samplePaper, true, true);
    assert.ok(html.includes('Excellence Academy'));
    assert.ok(html.includes('ANSWER KEY & EVALUATION SHEET'));
    assert.ok(html.includes('katex.min.js'));
    assert.ok(html.includes('Q.1.'));
    console.log('  ✓ Publication-grade HTML generated with KaTeX, answer key, and exam styling');
  }

  console.log('\n======================================================');
  console.log('🎉 ALL TESTS PASSED SUCCESSFULLY (7/7 VERIFIED)');
  console.log('======================================================\n');
}

runTests().catch((err) => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
