
import React from 'react';
import { Reminder } from '../types';
import { Bell, Trash2, Clock, Pill } from 'lucide-react';

interface RemindersManagerProps {
  reminders: Reminder[];
  onDelete: (id: string) => void;
  t: any;
}

const RemindersManager: React.FC<RemindersManagerProps> = ({ reminders, onDelete, t }) => {
  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
        <Bell className="text-blue-600" size={24} />
        {t.remindersTitle}
      </h2>

      {reminders.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center text-slate-400">
          <Clock size={48} className="mx-auto mb-4 opacity-20" />
          <p>{t.noReminders}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reminders.sort((a, b) => a.time.localeCompare(b.time)).map((reminder) => (
            <div 
              key={reminder.id}
              className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className="bg-blue-50 text-blue-600 p-3 rounded-xl font-bold text-lg">
                  {reminder.time}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Pill size={14} className="text-slate-400" />
                    {reminder.medicineName}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">{reminder.dosage}</p>
                </div>
              </div>
              
              <button 
                onClick={() => onDelete(reminder.id)}
                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                title={t.deleteReminder}
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RemindersManager;
