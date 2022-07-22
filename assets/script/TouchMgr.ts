//全屏触摸 通过触摸事件 计算角度值 对箭头进行旋转
import { _decorator, Component, Node, EventTouch, director, Vec2, misc } from 'cc';
import { EVENT } from './Constant';
const { ccclass, property } = _decorator;

@ccclass('TouchMgr')
export class TouchMgr extends Component {

    @property(Node) shooter: Node = null;//箭头

    onLoad(){
        this.openTouch()
    }

    public openTouch(): void {
        this.node.on(Node.EventType.TOUCH_START, this._touchStart, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this._touchsMove, this);
        this.node.on(Node.EventType.TOUCH_END, this._touchEnd, this);
    }

    public closeTouch(): void {
        this.node.off(Node.EventType.TOUCH_START, this._touchStart, this);
        this.node.off(Node.EventType.TOUCH_MOVE, this._touchsMove, this);
        this.node.off(Node.EventType.TOUCH_END, this._touchEnd, this);
    }

    private _touchStart(e: EventTouch): void {
        let d = this.convertToDegree(e);
        this.shooter.angle = d;
    }

    private _touchsMove(e: EventTouch): void {
        let d = this.convertToDegree(e);
        this.shooter.angle = d;
        this.convertToDegree(e)
    }

    private _touchEnd(e: EventTouch): void {
        let d = this.convertToDegree(e);
        this.shooter.angle = d;
        // // 发送角度
        director.emit(EVENT.TOUCHEND_SHOOT, d);
    }

    // 转化角度
    private convertToDegree(e: EventTouch): number {
        let pos: Vec2 = e.getUILocation();
        let shooterPos = this.shooter.position;
        let x = pos.x - shooterPos.x;
        let y = pos.y - shooterPos.y;
        let radian = Math.atan2(y, x);
        // 弧度转角度 0 - 2π -> 0 - 360
        let degree = misc.radiansToDegrees(radian);
        // angle 与原版 rotation 差 90
        degree -= 90;
        console.log(degree);
        //限制角度 在-80 ~ 80
        if (degree < -80 && degree > -180) degree = -80;
        if (degree > 80 || degree <= -180) degree = 80;
        return degree;
    }
}

