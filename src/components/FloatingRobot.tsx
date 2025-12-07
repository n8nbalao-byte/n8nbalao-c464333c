import robotMascot from "@/assets/robot-mascot.png";

export function FloatingRobot() {
  return (
    <div className="fixed left-4 top-32 z-40 hidden lg:block">
      <img
        src={robotMascot}
        alt="Assistente Virtual"
        className="w-40 h-auto animate-float drop-shadow-2xl"
      />
    </div>
  );
}
