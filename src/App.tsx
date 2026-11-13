import { IS_STAGE } from './live/page';
import { StageFrame } from './live/StageFrame';
import { Dashboard } from './live/Dashboard';
import { useGame } from './game/useGame';
import { GameStage } from './game/GameStage';
import { GameControls } from './game/GameControls';
import { GonStage } from './skins/gon/GonStage';

function isGonSkin(): boolean {
  if (typeof window === 'undefined') return false;
  const param = new URLSearchParams(window.location.search).get('skin');
  if (param === 'gon') return true;
  if (param === 'classic') return false;
  return localStorage.getItem('lop_hoc_skin') === 'gon';
}

export default function App() {
  const game = useGame();
  const useGon = isGonSkin();
  const StageComponent = useGon ? GonStage : GameStage;

  // Trang cho TikTok LIVE Studio: chỉ có màn hình game
  if (IS_STAGE) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black">
        <StageFrame>
          <StageComponent game={game} />
        </StageFrame>
      </div>
    );
  }

  // Trang điều khiển: xem trước = ảnh chụp từ trang stage, im lặng
  return (
    <Dashboard
      status={game.status}
      channelName={game.channelName}
      preview={
        <StageFrame maxHeight={window.innerHeight - 40}>
          <StageComponent game={game} />
        </StageFrame>
      }
      extra={<GameControls view={game.view} stageCount={game.stageCount} />}
    />
  );
}
