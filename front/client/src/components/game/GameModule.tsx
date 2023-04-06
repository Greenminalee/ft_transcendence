import { MouseEvent, useEffect, useRef } from 'react';
import { useRecoilState, useSetRecoilState } from 'recoil';
import { socket } from 'components/layout/Layout';
import { countState, gameState } from 'utils/recoil/gameState';
import { errorState } from 'utils/recoil/error';
import 'styles/game/Game.css';

let mouseState = 0;
let pingTime = 0;

function GameModule(props: { gameMode: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const background = useRef<HTMLCanvasElement>(null);
  const [gameData, setGameData] = useRecoilState(gameState);
  const [countData, setCountData] = useRecoilState(countState);
  const setErrorMessage = useSetRecoilState(errorState);

  function draw_background(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    img: string
  ) {
    if (img === 'map') {
      const image = new Image();
      image.src = '/galaxy.jpg';
      image.onload = function () {
        ctx.drawImage(image, 0, 0, width, height);
      };
    } else if (img === 'power') {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, width, height);
      draw_text(ctx, 'POWER!', Math.floor(width / 2), 50);
    } else {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, width, height);
    }
  }

  function draw_ball(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.fillStyle = 'black';
    ctx.fillRect(x, y, 10, 10);
  }

  function draw_paddle(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number
  ) {
    ctx.fillStyle = 'black';
    ctx.fillRect(x, y, width, height);
  }

  function draw_text(
    ctx: CanvasRenderingContext2D,
    text: string,
    width: number,
    height: number
  ) {
    ctx.textAlign = 'center';
    ctx.font = '40pt DungGeunMo';
    ctx.fillStyle = 'black';
    ctx.strokeText(text, width, height);
    ctx.fillText(text, width, height);
  }

  function saveMouseState(event: MouseEvent) {
    const canvasEle = canvas.current as HTMLCanvasElement;
    const ratio: number = canvasEle.height / canvasEle.clientHeight;

    mouseState = event.nativeEvent.offsetY * ratio;
  }

  useEffect(() => {
    const canvasEle = background.current!;
    const ctx = canvasEle.getContext('2d')!;

    draw_background(ctx, canvasEle.width, canvasEle.height, props.gameMode);

    socket.on('count-down', (data) => {
      setCountData(data);
    });
    socket.on('game-data', (data, callback) => {
      setGameData(data);
      if (typeof callback === 'function') callback((mouseState / 350) * 100);
    });
    socket.on('spectate-data', (data) => {
      setGameData(data);
    });
    socket.on('game-end', (data: string) => {
      clearInterval(ping_interval);
      setCountData(`${data} win!`);
    });
    const ping_interval = setInterval(() => {
      const time = Date.now();
      socket.emit('get-ping', () => {
        pingTime = Date.now() - time;
      });
    }, 500);
  }, []);

  useEffect(() => {
    const canvasEle = canvas.current!;
    const ctx = canvasEle.getContext('2d')!;
    const displayWidth = canvasEle.width;
    const displayHeight = canvasEle.height;

    ctx.clearRect(0, 0, displayWidth, displayHeight);
    draw_ball(
      ctx,
      Math.floor((gameData.ball.x / 100) * displayWidth),
      Math.floor((gameData.ball.y / 100) * displayHeight)
    );
    draw_paddle(
      ctx,
      Math.floor(0.05 * displayWidth),
      Math.floor(((gameData.firstPlayerPaddle - 10) / 100) * displayHeight),
      Math.floor(0.015 * displayWidth),
      Math.floor(0.2 * displayHeight)
    );
    draw_paddle(
      ctx,
      Math.floor(0.945 * displayWidth),
      Math.floor(((gameData.secondPlayerPaddle - 10) / 100) * displayHeight),
      Math.floor(0.015 * displayWidth),
      Math.floor(0.2 * displayHeight)
    );
    draw_text(
      ctx,
      gameData.firstPlayerScore.toString(),
      Math.floor(displayWidth / 4),
      50
    );
    draw_text(
      ctx,
      gameData.secondPlayerScore.toString(),
      Math.floor(displayWidth * 0.75),
      50
    );
  }, [gameData]);

  useEffect(() => {
    const canvasEle = canvas.current!;
    const ctx = canvasEle.getContext('2d')!;
    const displayWidth = canvasEle.width;
    const displayHeight = canvasEle.height;

    ctx.clearRect(0, 0, displayWidth, displayHeight);
    draw_text(
      ctx,
      countData,
      Math.floor(displayWidth / 2),
      Math.floor(displayHeight / 2)
    );
  }, [countData]);

  return (
    <div>
      <canvas
        ref={background}
        height="350px"
        width="700px"
        id="background-layer"
      />
      <canvas
        ref={canvas}
        onMouseMove={saveMouseState}
        height="350px"
        width="700px"
        id="game-layer"
      />
      <canvas />
      <div id="ping-message">ping : {pingTime}</div>
      <div id="guide-message">
        <div className="guide-message-title">게임 방법</div>
        마우스를 움직여 패들을 조작할 수 있습니다.
        <br />
        패들을 이용해 공을 튕겨내 상대방이 받아치지 못하면 점수를 얻습니다.
        <br />
        먼저 10점을 달성하는 사람이 승리합니다.
      </div>
    </div>
  );
}
export default GameModule;
