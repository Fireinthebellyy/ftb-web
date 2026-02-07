import React, { useState } from 'react';
import { X, Calendar, Type, AlignLeft } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface AddEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (event: any) => void;
}

export default function AddEventModal({ isOpen, onClose, onAdd }: AddEventModalProps) {
    const [form, setForm] = useState({
        title: '',
        date: '',
        type: 'Deadline', // Deadline, Interview, Other
        description: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAdd(form);
        onClose();
        setForm({ title: '', date: '', type: 'Deadline', description: '' });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-sm p-6 bg-white rounded-2xl">
                <div className="relative">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-slate-900">Add New Event</h3>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1 mb-1">
                                <Type size={12} /> Event Title
                            </label>
                            <input
                                required
                                className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                                value={form.title}
                                onChange={e => setForm({ ...form, title: e.target.value })}
                                placeholder="e.g. Mock Interview"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1 mb-1">
                                <Calendar size={12} /> Date
                            </label>
                            <input
                                type="date"
                                required
                                className="w-full border p-2 rounded-lg text-sm"
                                value={form.date}
                                onChange={e => setForm({ ...form, date: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1">Type</label>
                            <select
                                className="w-full border p-2 rounded-lg text-sm bg-white"
                                value={form.type}
                                onChange={e => setForm({ ...form, type: e.target.value })}
                            >
                                <option value="Deadline">Deadline</option>
                                <option value="Interview">Interview</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1 mb-1">
                                <AlignLeft size={12} /> Notes
                            </label>
                            <textarea
                                className="w-full border p-2 rounded-lg text-sm h-20 resize-none"
                                value={form.description}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                                placeholder="Optional details..."
                            />
                        </div>

                        <button type="submit" className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors">
                            Add to Agenda
                        </button>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
