"use strict"

const MAX_BALLOON_RADIUS = 30;
const MIN_BALLOON_RADIUS = 15;
const VIEWPORT_WIDTH = 800;
const VIEWPORT_HEIGHT = 600;
const NEEDLE_LENGTH = 10;

function randomColor(){
    return Math.floor(Math.random() * 255);
}
function onFinish(total, missed){
    alert(`Your score is: ${parseInt(total/(total+missed) *100, 10)}%`)
}

class Game {
    constructor(canvas, needle, timer, totalScore, missed, btn) {
        this.canvas = canvas; // элемент-canvas (основной слой игры, в котором появляются шары и ветер)
        this.needle = needle; // элемент-canvas (отдельный слой, чтобы ререндер не влиял на основной слой viewport)
        this.gameStateOver = false; // Состояние игры false - игра не окончена
        this.needlePosX =  this.needle.width / 2; // Начальная позиция игры по центру
        this.timer = timer; // элемент, куда записывается значение this.time
        this.totalScore = totalScore; // элемент, куда мы записываем количество "лопнувших" шаров
        this.missed = missed; // элемент, куда мы записываем количество пропущенных шаров
        this.gameButton = btn; // элемент кнопка, здесь нужна на отработку события "завершение игры"
        this.missedCounter = 0; // начальное значение пропущенных харов
        this.time = 60; // начальное значение таймера 1мин=60 сек
        this.timerID = 0; // айди таймера, отсчитывающего время
        this.spawnIntervalID = 0; // айди интервала появления шаров
        this.renderID = 0; //айди интервала рендера
        this.spawnSpeed = 500; // Начальное значение скорости появления шаров
        this.windLeftSide = 0; // ветер слева
        this.windRightSide = 0; //соотвественно справа
        this.balloonSpeed = 4; //Максимальная скорость шара
        this.refresh = ()=>{ //функция, возвращающая ключевые значения в исходное состояние
            this.gameStateOver = false;
            this.spawnSpeed = 500;
            this.windLeftSide = 0;
            this.windRightSide = 0;
            this.balloonSpeed = 4;
            this.time = 60;
            this.missedCounter = 0;
            this.needlePosX =  this.needle.width / 2;
            this.balloonsArr = [];
        };

        this.newBalloon = new Event('newBalloon'); //Наше событие появления шара
        this.balloonsArr = []; // объект, содержащий в себе все шары и их данные
        this.balloon = () =>{ // конструктор объекта шар
            const radius = Math.round(MIN_BALLOON_RADIUS + Math.random() * (MAX_BALLOON_RADIUS - MIN_BALLOON_RADIUS) );
            return {
                x:Math.round(MAX_BALLOON_RADIUS+ Math.random() * (VIEWPORT_WIDTH - MAX_BALLOON_RADIUS) ),
                y: VIEWPORT_HEIGHT - radius,
                radius: radius,
                startAngle: 0,
                endAngle: 2 * Math.PI,
                color: `rgba(${randomColor()}, ${randomColor()}, ${randomColor()}, 0.4`
            }
        };

        this.drawNeedle = (event) =>{ //перерисовка "иглы" по событию mousemove
            let x = event.offsetX;
            let y = event.offsetY;
            this.needlePosX = x;
            this.mountNeedle();
        }

        this.redrawBalloons = (event)=>{ // добавление нового шара и рирендер слоя
            this.balloonsArr.push(this.balloon());
            const ctx = this.canvas.getContext('2d');
            ctx.clearRect(0,0, canvas.width, canvas.height);
            for (let balloon of this.balloonsArr) {
                ctx.beginPath();
                ctx.fillStyle = balloon.color;
                ctx.arc(balloon.x, balloon.y, balloon.radius, balloon.startAngle, balloon.endAngle);
                ctx.fill();
                ctx.stroke();
                ctx.closePath();
            }
        }
    }

    spawnBalloons(interval) { // функция- создатель шаров, интервал внутри погибает каждый раз по условию и вызывается снова с новым значением interval
        this.spawnIntervalID = setInterval(()=>{
        this.canvas.dispatchEvent(this.newBalloon);
        }, interval);
    }

    changeBalPosBasedOnWind(leftWind, rightWind, currentPosX){ //функция, расчитывающая "близость" шара к краю и меняющая его позицию, на основании ветра
        const seed = Math.round(Math.random() * 100);

        if(seed%3===1) {
            const windPowerLeft = ~~((VIEWPORT_WIDTH / currentPosX * leftWind) );
            return currentPosX +=  windPowerLeft;
        }else if(seed%3===2) {
            const windPowerRight = ~~(currentPosX / VIEWPORT_WIDTH * rightWind);
            return currentPosX -=  windPowerRight;
        }
        return currentPosX;
    }

    render(){  //Основная функция "рисовальщик", хранит в себе логику поведения шара на соприкосновение с "иглой", а также поведение при окончании игры
        this.renderID = setInterval(()=>{
            if(this.gameStateOver && this.balloonsArr.length===0) {
                 const clickEvent = new Event( 'click' );
                 this.gameButton.dispatchEvent(clickEvent);
                 onFinish(+this.totalScore.innerText, +this.missed.innerText);
            }

            const ctx = this.canvas.getContext('2d');
            ctx.clearRect(0,0, canvas.width, canvas.height);
            this.windLeftSide = Math.random();
            this.windRightSide = Math.random()* 10;

            this.balloonsArr.forEach((balloon, index)=>{

                balloon.y -= this.balloonSpeed - this.spawnSpeed/150;
                balloon.x = this.changeBalPosBasedOnWind(this.windLeftSide, this.windRightSide, balloon.x);
                ctx.beginPath();
                ctx.fillStyle = balloon.color;
                ctx.arc(balloon.x, balloon.y, balloon.radius, balloon.startAngle, balloon.endAngle);
                ctx.fill();
                ctx.stroke();
                ctx.closePath();

                if(!this.gameStateOver) {
                    if (balloon.y - balloon.radius <= NEEDLE_LENGTH && (this.needlePosX < balloon.x + balloon.radius && this.needlePosX > balloon.x - balloon.radius)) {
                        this.balloonsArr.splice(index, 1);
                        this.totalScore.innerText = String(+this.totalScore.innerText + 1);

                    } else if (balloon.y + balloon.radius <= 0) {
                        this.missedCounter++;
                        this.balloonsArr.splice(index, 1);
                        this.missed.innerText = String(this.missedCounter);
                    }
                }else{
                    if (balloon.y + balloon.radius <= 0) {
                        this.balloonsArr.splice(index, 1);
                    }
                    this.unmountNeedle();
                }

            })
        },10)

    }

    mountNeedle() {     //рисуем иглу
        const ctx = this.needle.getContext('2d');
        ctx.clearRect(0, 0, this.needle.width, this.needle.height);
        ctx.beginPath();
        ctx.moveTo(this.needlePosX , 0);
        ctx.lineTo(this.needlePosX  + 5, NEEDLE_LENGTH);
        ctx.lineTo(this.needlePosX  + 10, 0);
        ctx.fill();
        ctx.closePath();
    }
    unmountNeedle(){ //стриаем иглу
        const ctx = this.needle.getContext('2d');
        ctx.clearRect(0, 0, this.needle.width, this.needle.height);
        this.canvas.removeEventListener('mousemove',this.drawNeedle);
    }
    clearViewport(){ //очищаем основной слой игры
        const ctx = this.canvas.getContext('2d');
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    startTimer(){ // таймер нашей игры
        this.timer.innerText = '60 sec';
            this.timerID = setInterval(() => {
                if(this.time !==0) {
                clearInterval(this.spawnIntervalID);
                this.time = +this.timer.innerText.split(' ')[0] - 1;
                this.timer.innerText = this.time + ' sec';
                this.spawnSpeed = (this.time % 3 == 0 && this.time > 0) ? this.spawnSpeed - 25 : this.spawnSpeed;
                this.spawnBalloons(this.spawnSpeed);
                }else {
                    this.gameStateOver = true;
                    clearInterval(this.spawnIntervalID);
                }
            }, 1000);

    }


    listen(){ // инициализация игры
        this.gameStateOver = false;
        this.startTimer();
        this.totalScore.innerText = '0';
        this.missed.innerText = '0';
        this.windLeftSide = Math.random();
        this.windLeftSide = Math.random();
        this.canvas.addEventListener('mousemove', this.drawNeedle);
        this.canvas.addEventListener('newBalloon', this.redrawBalloons);
        this.render();
    }

    unmount(){ // игра окончена, избавляемся от мусора
        this.unmountNeedle();
        clearInterval(this.timerID);
        clearInterval(this.spawnIntervalID);
        clearInterval(this.renderID);
        this.canvas.removeEventListener('mousemove',this.drawNeedle);
        this.canvas.removeEventListener('newBalloon', this.redrawBalloons);
        this.clearViewport();
        this.refresh();
    }

}



const canvas = document.getElementById('viewport');
const needleCanvas = document.getElementById('needle');
const timerElem = document.getElementById('timer');
const score = document.getElementById('totalScore');
const missed = document.getElementById('missedBaloons');
const btn = document.getElementById('gameBtn');
const game = new Game(canvas, needleCanvas, timerElem, score, missed, btn);

function onButtonClick(){
    switch (btn.innerText){
        case 'Start':
            btn.innerText = 'Stop';
            btn.className = 'btn btn-danger'
            game.mountNeedle();
            game.listen();
            break;
        case 'Stop':
            btn.innerText = 'Start';
            btn.className = 'btn btn-success';
            game.unmount();
            break;
    }
}
