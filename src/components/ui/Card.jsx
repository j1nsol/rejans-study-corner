export default function Card({ children, className = "", tape = false, ...props }) {
  return (
    <div
      className={`relative rounded-cute bg-white/80 backdrop-blur-sm border border-white shadow-card p-6 ${className}`}
      {...props}
    >
      {tape && <span className="washi-tape" aria-hidden="true" />}
      {children}
    </div>
  );
}
