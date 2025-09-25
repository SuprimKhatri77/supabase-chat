export default function Loader() {
  return (
    <div
      className={`inline-block 
          border-white
      h-4 w-4 animate-spin rounded-full border-3 border-solid border-e-transparent align-[-0.125em] text-surface motion-reduce:animate-[spin_1.5s_linear_infinite] dark:text-white`}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}
