import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface AddApplicationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (opp: any, status: string) => void;
}

export default function AddApplicationModal({ isOpen, onClose, onAdd }: AddApplicationModalProps) {
    const [form, setForm] = useState({ title: '', company: '', deadline: '' });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const id = Date.now(); // Simple ID generation
        onAdd({
            id,
            ...form,
            status: 'Not Applied',
            type: 'Internship',
            logo: null // Or default placeholder
        }, 'Not Applied');
        onClose();
        setForm({ title: '', company: '', deadline: '' });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-sm p-6 bg-white rounded-2xl">
                <div className="relative">
                    <h3 className="text-xl font-bold text-slate-900 mb-4">Add Manual Application</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Role Title</label>
                            <input required className="w-full border p-2 rounded-lg" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Frontend Intern" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Company</label>
                            <input required className="w-full border p-2 rounded-lg" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} placeholder="e.g. Startup Inc." />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Deadline</label>
                            <input type="date" required className="w-full border p-2 rounded-lg" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
                        </div>
                        <button type="submit" className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800">Add to Tracker</button>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
