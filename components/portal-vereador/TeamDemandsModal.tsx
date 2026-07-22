'use client';
import React from 'react';
import { X, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TeamDemandsModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: any;
}

export function TeamDemandsModal({ isOpen, onClose, team }: TeamDemandsModalProps) {
  if (!isOpen || !team) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.95 }}
          className="bg-white rounded-3xl p-8 w-full max-w-4xl max-h-[80vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-2xl font-bold text-[#0a192f]">
              Demandas: {team.name}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
              <X className="w-6 h-6 text-slate-500" />
            </button>
          </div>
          
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Filtrar por cidadão, assunto ou status..." 
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm"
              />
            </div>
          </div>
          
          <div className="text-center py-20 text-slate-400 italic">
            Visualização de detalhes técnicos das demandas será implementada aqui (com dados reais do Supabase).
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
