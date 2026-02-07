import Tracker from '@/components/tracker/Tracker';

import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Personal Tracker | Fire in the Belly',
    description: 'Track and manage your internship applications.',
};

export default function TrackerPage() {
    return (
        <div className="min-h-screen bg-slate-50">
            <Tracker />
        </div>
    );
}
