import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { AuthService } from '@/lib/auth';
import { AuditLogService } from '@/lib/audit';

function getAuthUser(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  let token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  if (!token) {
    token = req.cookies.get('medivault_session')?.value || null;
  }
  if (!token) return null;
  return AuthService.verifyToken(token);
}

// GET /api/patients - List patients
export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthenticated.' }, { status: 401 });
    }

    const res = await pool.query(
      `SELECT id, patient_code, name, age, gender, blood_group, ward_room, 
              admission_status, diagnosis, vitals_summary, prescription, treatment_plan,
              attending_doctor, assigned_nurse, created_at
       FROM patients
       WHERE deleted_at IS NULL
       ORDER BY id DESC
       LIMIT 100`
    );

    return NextResponse.json({
      success: true,
      patients: res.rows,
      total: res.rows.length,
    });
  } catch (err: any) {
    console.error('GET /api/patients error:', err);
    return NextResponse.json({ success: false, message: 'Failed to retrieve patient records.' }, { status: 500 });
  }
}

// POST /api/patients - Create new in-patient admission
export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthenticated.' }, { status: 401 });
    }

    const role = (user.role || '').toLowerCase();
    const canAdmit = role.includes('doctor') || role.includes('manager');
    if (!canAdmit) {
      return NextResponse.json(
        {
          success: false,
          message: 'Access Denied: In-patient admission is strictly reserved for Attending Physicians and the Managing Director (MD). Administrators do not admit patients.',
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      patient_code,
      name,
      age,
      gender = 'Male',
      blood_group = 'O+',
      ward_room = 'General Ward',
      admission_status = 'Admitted',
      diagnosis,
      vitals_summary = 'BP 120/80 mmHg | Heart Rate 72 bpm | Temp 36.8 deg C | SpO2 99%',
      prescription = '',
      treatment_plan = '',
      attending_doctor,
      assigned_nurse = 'Nurse Beatrice Mensah, RN',
    } = body;

    if (!name || !diagnosis) {
      return NextResponse.json(
        { success: false, message: 'Patient name and diagnosis are required.' },
        { status: 400 }
      );
    }

    const code = patient_code || `MED-${Math.floor(1000 + Math.random() * 9000)}`;
    const doctor = attending_doctor || user.name || 'Dr. Isaac Donkoh, MD';

    const insertRes = await pool.query(
      `INSERT INTO patients 
        (patient_code, name, age, gender, blood_group, ward_room, admission_status, 
         diagnosis, vitals_summary, prescription, treatment_plan, attending_doctor, 
         assigned_nurse, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
       RETURNING *`,
      [
        code,
        name,
        parseInt(age) || 30,
        gender,
        blood_group,
        ward_room,
        admission_status,
        diagnosis,
        vitals_summary,
        prescription,
        treatment_plan,
        doctor,
        assigned_nurse,
      ]
    );

    // Record immutable audit event for patient admission
    await AuditLogService.record({
      userId: user.userId,
      eventType: 'patient.admitted',
      description: `Attending Physician [${user.email}] admitted patient [${name} (${code})] into [${ward_room}] with diagnosis: [${diagnosis}]. Attending Doctor: [${doctor}]. Assigned Nurse: [${assigned_nurse}].`,
      severity: 'info',
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
    });

    return NextResponse.json({
      success: true,
      message: `Patient ${name} admitted successfully.`,
      patient: insertRes.rows[0],
    });
  } catch (err: any) {
    if (err?.digest?.startsWith('NEXT_')) throw err;
    console.error('POST /api/patients error:', err);
    return NextResponse.json({ success: false, message: 'Could not record admission.' }, { status: 500 });
  }
}
