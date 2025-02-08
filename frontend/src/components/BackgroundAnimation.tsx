import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const BackgroundAnimation = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: e.clientX,
        y: e.clientY,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <>
      {/* Animated gradient background */}
      <motion.div 
        className="fixed inset-0 bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900"
        animate={{
          background: [
            'linear-gradient(to bottom right, #111827, #4C1D95, #1E40AF)',
            'linear-gradient(to bottom right, #1E40AF, #111827, #4C1D95)',
            'linear-gradient(to bottom right, #4C1D95, #1E40AF, #111827)',
          ],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      />
      
      {/* Interactive floating orbs */}
      <div className="fixed inset-0 overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full mix-blend-screen filter blur-xl"
            style={{
              background: `radial-gradient(circle, ${
                i % 2 === 0 ? '#8B5CF6' : '#3B82F6'
              } 0%, transparent 70%)`,
              width: `${Math.random() * 400 + 200}px`,
              height: `${Math.random() * 400 + 200}px`,
            }}
            animate={{
              x: [
                Math.random() * window.innerWidth,
                Math.random() * window.innerWidth,
              ],
              y: [
                Math.random() * window.innerHeight,
                Math.random() * window.innerHeight,
              ],
              scale: [1, Math.random() * 0.3 + 0.8],
            }}
            transition={{
              duration: Math.random() * 10 + 20,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
            drag
            dragConstraints={{
              top: 0,
              left: 0,
              right: window.innerWidth - 100,
              bottom: window.innerHeight - 100,
            }}
            whileHover={{ scale: 1.2 }}
          />
        ))}
      </div>

      {/* Mouse follower effect */}
      <motion.div
        className="fixed pointer-events-none w-96 h-96 rounded-full"
        animate={{
          x: mousePosition.x - 192,
          y: mousePosition.y - 192,
        }}
        transition={{ type: "spring", damping: 30, stiffness: 200 }}
        style={{
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
      
      {/* Animated grid */}
      <div className="fixed inset-0" style={{ opacity: 0.03 }}>
        <motion.div 
          className="absolute inset-0"
          animate={{
            backgroundPosition: ['0px 0px', '50px 50px'],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "linear",
          }}
          style={{
            backgroundImage: `linear-gradient(#fff 1px, transparent 1px),
                           linear-gradient(90deg, #fff 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />
      </div>
    </>
  );
};

export default BackgroundAnimation;
