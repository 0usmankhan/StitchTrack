'use server';

import { getFirebaseAdmin } from '@/lib/firebase-admin';
import bcrypt from 'bcryptjs';

export async function createTeamMember(
    accountId: string,
    data: {
        email: string;
        password: string;
        roleId: string;
        displayName: string;
        pin?: string;
        salaryType?: string;
        salaryAmount?: number;
    }
) {
    try {
        const { auth, firestore } = await getFirebaseAdmin();

        // 1. Create Auth User
        const userRecord = await auth.createUser({
            email: data.email,
            password: data.password,
            displayName: data.displayName,
            emailVerified: true, // Auto-verify to prevent login issues? User asked about verification. Let's set true for now to smooth things.
        });
        const uid = userRecord.uid;

        // 2. Hash PIN if provided
        let hashedPin = undefined;
        if (data.pin) {
            const salt = await bcrypt.genSalt(10);
            hashedPin = await bcrypt.hash(data.pin, salt);
        }

        // 3. Create Membership in Account
        await firestore
            .collection('accounts')
            .doc(accountId)
            .collection('memberships')
            .doc(uid)
            .set({
                email: data.email,
                roleId: data.roleId,
                displayName: data.displayName || data.email,
                status: 'accepted',
                invitedBy: accountId,
            });

        // 4. Create User Profile Link
        const userProfile: any = {
            email: data.email,
            associatedAccountId: accountId, // CRITICAL: Links user to this account
        };

        if (hashedPin) {
            userProfile.accessPin = hashedPin;
            userProfile.pinSetAt = new Date(); // Use server date
        }

        if (data.salaryType && data.salaryAmount) {
            userProfile.salaryType = data.salaryType;
            if (data.salaryType === 'HOURLY') userProfile.hourlyRate = data.salaryAmount;
            if (data.salaryType === 'SALARY') userProfile.baseSalary = data.salaryAmount;
        }

        await firestore.collection('users').doc(uid).set(userProfile, { merge: true });

        return { success: true, uid };
    } catch (error: any) {
        console.error('Error creating team member:', error);
        return { success: false, error: error.message };
    }
}
