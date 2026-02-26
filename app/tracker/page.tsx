import Tracker from '@/components/tracker/Tracker';
import { Suspense } from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Personal Tracker | Fire in the Belly',
    description: 'Track and manage your internship applications.',
};

export default function TrackerPage() {
    return (
        <div className="min-h-screen bg-slate-50">
            <Suspense fallback={<div className="flex h-[50vh] w-full items-center justify-center">Loading tracker...</div>}>
                <Tracker />
            </Suspense>
        </div>
    );
}
