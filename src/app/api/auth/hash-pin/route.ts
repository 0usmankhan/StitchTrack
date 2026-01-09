import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

const validatePinFormat = (pin: string): boolean => {
  return /^\d{4,6}$/.test(pin);
};

export async function POST(request: NextRequest) {
  try {
    const { pin } = await request.json();

    if (!pin) {
      return NextResponse.json(
        { error: 'PIN is required' },
        { status: 400 }
      );
    }
    
    if (!validatePinFormat(pin)) {
        return NextResponse.json(
            { error: 'Invalid PIN format. Must be 4-6 digits.' },
            { status: 400 }
        );
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPin = await bcrypt.hash(pin, salt);

    return NextResponse.json({ hashedPin });
  } catch (error: any) {
    console.error('Error hashing PIN:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to hash PIN' },
      { status: 500 }
    );
  }
}
