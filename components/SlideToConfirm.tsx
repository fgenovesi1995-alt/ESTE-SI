
import React, { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';

interface SlideToConfirmProps {
    onConfirm: () => void;
    label: string;
}

const SlideToConfirm: React.FC<SlideToConfirmProps> = ({ onConfirm, label }) => {
    const x = useMotionValue(0);
    const opacity = useTransform(x, [0, 150], [1, 0]);
    const [isConfirmed, setIsConfirmed] = useState(false);

    const handleDragEnd = () => {
        if (x.get() > 180) {
            setIsConfirmed(true);
            onConfirm();
        } else {
            x.set(0);
        }
    };

    return (
        <div className="relative w-full max-w-[280px] h-14 bg-gray-100 dark:bg-gray-800 rounded-full p-1 overflow-hidden select-none">
            {/* Background Label */}
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    {isConfirmed ? 'Confirmado' : label}
                </span>
            </div>

            {/* Draggable Handle */}
            {!isConfirmed && (
                <motion.div
                    drag="x"
                    dragConstraints={{ left: 0, right: 220 }}
                    style={{ x }}
                    onDragEnd={handleDragEnd}
                    className="relative z-10 size-12 bg-primary rounded-full flex items-center justify-center shadow-lg cursor-grab active:cursor-grabbing"
                >
                    <span className="material-symbols-outlined text-white">chevron_right</span>
                </motion.div>
            )}

            {/* Progress Overlay */}
            <motion.div
                style={{ width: x, opacity }}
                className="absolute left-0 top-0 bottom-0 bg-primary/10 rounded-full"
            />
        </div>
    );
};

export default SlideToConfirm;
