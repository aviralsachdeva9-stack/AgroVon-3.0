import React, { useState } from 'react';
import { ArrowLeft, Bell, Cloud, Sun, ArrowRight, Plus } from 'lucide-react';
import { ViewState, Note } from '../types';

interface NotesViewProps {
  setView: (view: ViewState) => void;
}

const MOCK_NOTES: Note[] = [
  {
    id: '1',
    date: 'May 24',
    time: '5:43pm',
    title: 'Excellent harvest',
    content: 'The grapes have a rich flavor and aroma.',
    image: 'https://picsum.photos/100/100?random=20'
  },
  {
    id: '2',
    date: 'May 24',
    time: '5:43pm',
    title: 'Pesticide Application',
    content: 'Applied organic pesticides to the northern sector.',
    image: 'https://picsum.photos/100/100?random=21'
  },
  {
    id: '3',
    date: 'May 24',
    time: '5:43pm',
    title: 'Soil Testing',
    content: 'pH levels are optimal for the upcoming planting season.',
    image: 'https://picsum.photos/100/100?random=22'
  },
  {
    id: '4',
    date: 'May 24',
    time: '5:43pm',
    title: 'Irrigation Check',
    content: 'All systems operational. No leaks detected.',
    image: 'https://picsum.photos/100/100?random=23'
  }
];

const NotesView: React.FC<NotesViewProps> = ({ setView }) => {
  return (
    <div className="bg-gray-50 min-h-screen pb-24">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 flex justify-between items-center">
        <button onClick={() => setView(ViewState.HOME)} className="p-2 bg-white rounded-full shadow-sm text-gray-800">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-lg font-semibold text-gray-800">Todays Weather</span>
        <button className="p-2 bg-white rounded-full shadow-sm text-gray-800 relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>
      </div>

      {/* Weather Card Green */}
      <div className="mx-6 bg-[#0f4c3a] rounded-3xl p-6 text-white relative overflow-hidden shadow-lg mb-8">
        <div className="relative z-10">
            <div className="text-emerald-200 text-xs font-medium mb-1">Bekasi Timur, 27 Nov 2023</div>
            <div className="flex justify-between items-center mb-4">
                <div>
                    <div className="text-5xl font-bold mb-1">33°<span className="text-3xl font-normal text-emerald-200">C</span></div>
                    <div className="text-sm text-emerald-100">Humidity 76%</div>
                </div>
                <div className="flex flex-col items-center">
                    <div className="relative mb-1">
                        <Sun className="w-10 h-10 text-yellow-400 fill-yellow-400" />
                        <Cloud className="w-10 h-10 text-white fill-white absolute top-3 -right-2 opacity-90" />
                    </div>
                    <span className="text-sm font-medium">Cloudy</span>
                </div>
            </div>
            <div className="text-xs text-emerald-200/80 pt-4 border-t border-emerald-800">
                Today is a good day to apply pesticides.
            </div>
        </div>
        
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-xl"></div>
      </div>

      {/* Notes Section */}
      <div className="px-6">
        <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-gray-900 text-lg">Notes</h2>
            <button className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <ArrowRight className="w-4 h-4 text-gray-600" />
            </button>
        </div>

        <div className="flex flex-col gap-4">
            {MOCK_NOTES.map((note) => (
                <div key={note.id} className="bg-white p-3 rounded-2xl flex gap-4 shadow-sm">
                    <img src={note.image} alt="Note thumb" className="w-16 h-16 rounded-xl object-cover shrink-0" />
                    <div className="flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-gray-900 text-sm">{note.date}</span>
                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                            <span className="text-gray-400 text-xs">{note.time}</span>
                        </div>
                        <p className="text-xs text-gray-800 font-medium mb-0.5">{note.title}</p>
                        <p className="text-[10px] text-gray-500 line-clamp-2 leading-tight">
                            {note.content}
                        </p>
                    </div>
                </div>
            ))}
        </div>

        <button className="mt-6 w-full py-4 bg-[#134e4a] text-white rounded-2xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-green-900/20 hover:bg-[#0f3f3b] transition-colors">
            <Plus className="w-5 h-5" />
            Add New Note
        </button>
      </div>
    </div>
  );
};

export default NotesView;
