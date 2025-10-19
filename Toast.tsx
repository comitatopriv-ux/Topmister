
import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { ToastType } from '../../types';

interface ToastProps {
  message: string;
  type: ToastType;
}

const Toast: React.FC<ToastProps> = ({ message, type }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
    }, 2800); 

    return () => clearTimeout(timer);
  }, [message, type]);

  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
  const Icon = type === 'success' ? CheckCircle : XCircle;

  return (
    <div
      className={`fixed top-5 right-5 flex items-center gap-3 p-4 rounded-lg text-white shadow-lg z-50 transition-transform duration-300 ease-out ${bgColor} ${
        visible ? 'transform translate-x-0' : 'transform translate-x-[calc(100%+20px)]'
      }`}
    >
      <Icon size={24} />
      <span>{message}</span>
    </div>
  );
};

export default Toast;
