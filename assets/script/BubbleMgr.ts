//小球管理类
import { _decorator, Component, Node, SpriteFrame, Prefab, JsonAsset, Vec2, Vec3, instantiate, director, misc, v2, v3 } from 'cc';
import { Bubble } from './Bubble';
import { EVENT } from './Constant';
import { Util } from './Util';
const { ccclass, property } = _decorator;

/** 泡泡对象 */
interface bubbleData {
    node: Node,//节点
    color: number,//颜色
    isVisited: boolean,//是否被访问过
    isLinked: boolean//是否链接着
}

@ccclass('BubbleMgr')
export class BubbleMgr extends Component {

    /** 泡泡纹理 */
    @property([SpriteFrame]) bubbleSpriteFrame: SpriteFrame[] = [];
    /** 预制体 */
    @property(Prefab) bubblePrefab: Prefab = null;
    /** 确认发射点 */
    @property(Node) shooter: Node = null;
    /** 关卡数据 */
    @property(JsonAsset) levelData: JsonAsset = null;//josn数据 0 代表没有泡泡 1,2,3,4代表4种泡泡

    /** 装载场景中所有泡泡，注意 s 这是二维数组 */
    public bubblesArray: bubbleData[][] = [];
    /** 当前待发射球 */
    public shootBubble: bubbleData;
    /** 是否正在射击的标志 */
    public isShooting: boolean = false;
    /** 射出方向 */
    public shootDir: Vec3 = null;

    public onLoad() {
        this.init("lv1");
        // 监听触摸结束
        director.on(EVENT.TOUCHEND_SHOOT, (data) => {
            console.log('BubbleMgr -on -touchend');
            // console.log(data);
            // FIX: 小球飞行时不应触发点击事件
            if (this.isShooting) return;
            // 转为弧度
            let r = misc.degreesToRadians(data);
            // 分量 x - sin  y - cos
            this.shootDir = v3(-Math.sin(r), Math.cos(r));
            // console.log(this.shootDir);
            // 开启射击
            this.isShooting = true;
        }, this);

        this._createOneShooter();
    }

    public update(dt: number) {
        if (this.isShooting) {
            // 小球移动
            this._bubbleMove(dt);
            this._isCollided();
        }
    }

    private _bubbleMove(dt: number): void {
        // 移动速度
        let speed = 1000;
        // let n: Node = this.shootBubble.node;
        // // 左右出区域要改向 因为不知正负，先求绝对值
        // if (n.x < Util.BUBBLE_R) this.shootDir.x = Math.abs(this.shootDir.x);
        // if (n.x > Util.SCREEN_W - Util.BUBBLE_R) this.shootDir.x = -Math.abs(this.shootDir.x);
        // n.x += this.shootDir.x * speed * dt;
        // n.y += this.shootDir.y * speed * dt;

        let n: Vec3 = this.shootBubble.node.position;
        // 左右出区域要改向 因为不知正负，先求绝对值
        if (n.x < Util.BUBBLE_R) this.shootDir.x = Math.abs(this.shootDir.x);
        if (n.x > Util.SCREEN_W - Util.BUBBLE_R) this.shootDir.x = -Math.abs(this.shootDir.x);
        let X = n.x += this.shootDir.x * speed * dt;
        let Y = n.y += this.shootDir.y * speed * dt;
        this.shootBubble.node.setPosition(X, Y)
    }

    /** 检测碰撞 */
    private _isCollided(): void {
        let shootBubblePos: Vec3 = this.shootBubble.node.position;
        for (let row = 0; row < this.bubblesArray.length; row++) {
            for (let col = 0; col < this.bubblesArray[row].length; col++) {
                // 是否存在小球
                if (!this.bubblesArray[row][col]) continue;
                let n: Vec3 = this.bubblesArray[row][col].node.position;
                console.log("是否存在小球", this.bubblesArray[row][col], n)
                // 先看 y 轴
                let offsetY = Math.abs(n.y - shootBubblePos.y);
                if (offsetY > Util.BUBBLE_R * 2) continue;
                // 再看 x 轴
                let offsetX = Math.abs(n.x - shootBubblePos.x);
                if (offsetX > Util.BUBBLE_R * 2) continue;
                // 再做乘法
                let dis = offsetX * offsetX + offsetY * offsetY;
                if (dis > Util.BUBBLE_R * 2 * Util.BUBBLE_R * 2) continue;
                // 在范围内，触发碰撞，停止射击移动
                this.isShooting = false;
                // 位置修正
                this._setBubblePos();
                // 如果有小球符合条件，return
                return;
            }
        }
        // 没触发碰撞且碰到最上方
        if (shootBubblePos.y > Util.SCREEN_H - Util.BUBBLE_R) {
            this.isShooting = false;
            // 位置修正
            this._setBubblePos();
        }
    }

    /** 根据停止位置，修正 */
    private _setBubblePos(): void {
        let pos: Vec3 = this.shootBubble.node.position;
        let index: Vec3 = Util.convertPosToRowCol(pos.x, pos.y);
        // this.shootBubble.node.position = Util.convertRowColToPos(index.x, index.y);
        this.shootBubble.node.setPosition(Util.convertRowColToPos(index.x, index.y))
        // 设置对应数据
        let obj: bubbleData = Object.create(null);
        obj.node = this.shootBubble.node;
        obj.color = this.shootBubble.color;
        obj.isLinked = false;
        obj.isVisited = false;
        this.bubblesArray[index.x][index.y] = obj;
        // 应该遍历相同颜色的泡泡了
        this._mapColor(index);
    }

    /** 相同颜色检测，传入当前小球位置 */
    private _mapColor(index: Vec3): void {
        // 检测消除方法
        let test: Function = (row: number, col: number, color: number) => {
            // 非空检测
            if (!this.bubblesArray[row] || !this.bubblesArray[row][col]) return;
            // 获取泡泡数据
            let b: bubbleData = this.bubblesArray[row][col];
            // 如果被访问过
            if (b.isVisited) return;
            // 如果颜色不同
            if (b.color !== color) return;
            // 符合条件
            b.isVisited = true;
            let leftTop = col;
            // 根据不同的行做偏移
            if (row % 2 === 0) {
                leftTop = col - 1;
            }
            // 每个泡泡周围有6个,依次检测
            // 左上
            test(row - 1, leftTop, color);
            //右上
            test(row - 1, leftTop + 1, color);
            //左
            test(row, col - 1, color);
            //右
            test(row, col + 1, color);
            //左下
            test(row + 1, leftTop, color);
            //右下
            test(row + 1, leftTop + 1, color);
        }

        // 执行
        test(index.x, index.y, this.bubblesArray[index.x][index.y].color);
        // 看有几个相同的
        let count: number = 0;
        // 记录消除行列值
        let record: Vec3[] = [];
        for (let row = 0; row < this.bubblesArray.length; row++) {
            for (let col = 0; col < this.bubblesArray[row].length; col++) {
                if (!this.bubblesArray[row][col]) continue;
                if (this.bubblesArray[row][col].isVisited) {
                    this.bubblesArray[row][col].isVisited = false;
                    count++;
                    // 记录要进行消除的泡泡行列值
                    record.push(v3(row, col));
                }
            }
        }
        if (count >= 3) {
            // 执行消除
            for (let i in record) {
                // 获取到该位置泡泡，执行消除
                let b = this.bubblesArray[record[i].x][record[i].y].node;
                b.getComponent(Bubble).playDeathAnimation(record[i]);
            }
            this.scheduleOnce(this._testUnLinked, 0.3);
            // this.scheduleOnce(this._nextBubble, 0.3);
        } else {
            this._nextBubble();
        }
    }

    /** 悬空检测 同理 */
    private _testUnLinked (): void {
        // 检测方法
        let test: Function = (row: number, col: number) => {
            //从刚刚加入的泡泡为起点,递归寻找相连的
            if (!this.bubblesArray[row] || !this.bubblesArray[row][col]) return;
            let b = this.bubblesArray[row][col];
            if (b.isVisited) return;
            // 符合条件
            b.isVisited = true;
            b.isLinked = true;
            let leftTop = col;
            if (row % 2 === 0) {
                leftTop = col - 1;
            }
		    // 每个泡泡周围有6个,依次检测
		    // 左上
		    test(row - 1, leftTop);
		    //右上
		    test(row - 1, leftTop + 1);
		    //左
		    test(row, col - 1);
		    //右
		    test(row, col + 1);
		    //左下
		    test(row + 1, leftTop);
		    //右下
		    test(row + 1, leftTop + 1);
        }
        // 执行
        for (let i = 0; i < this.bubblesArray[0].length; i++) {
            // 执行最上的一排泡泡
            if (!this.bubblesArray[0][i]) continue;
            test(0, i);
        }

        // 局部标志，是否执行过下落
        let flag: boolean = true;
        for (let row = 0; row < this.bubblesArray.length; row++) {
            for (let col = 0; col < this.bubblesArray[row].length; col++) {
                if (!this.bubblesArray[row][col]) continue;
                if (!this.bubblesArray[row][col].isLinked) {
                    flag = false;
                    let b = this.bubblesArray[row][col].node;
                    b.getComponent(Bubble).playDownAnimation(v3(row, col));
                } else {
                    this.bubblesArray[row][col].isVisited = false;
                    this.bubblesArray[row][col].isLinked = false;
                }
            }
        }
        if (flag) {
            this._nextBubble();
        } else {
            this.scheduleOnce(this._nextBubble, 0.6);
        }
    }

    private _nextBubble(): void {
        // 继续游戏
        this._createOneShooter();
    }

    // 根据数据初始化
    public init(str: string): void {
        // 获取到关卡数据
        let data: [][] = this.levelData.json[str];
        // 将所有数据遍历，0代表空
        for (let row = 0; row < data.length; row++) {
            let colBubbleData: bubbleData[] = data[row];
            // 一起初始化一下 bubblesArray
            this.bubblesArray[row] = [];
            for (let col = 0; col < colBubbleData.length; col++) {
                let color = data[row][col];
                if (color === 0) continue;
                // 实例化泡泡
                let b = instantiate(this.bubblePrefab);
                // 行列 -> 坐标
                let pos = Util.convertRowColToPos(row, col);
                // 调用泡泡初始化
                b.getComponent(Bubble).init(this, pos, this.bubbleSpriteFrame[color - 1]);
                // 往bubblesArray 里 设置对应数据
                let obj: bubbleData = Object.create(null);
                obj.node = b;
                obj.color = color;
                obj.isLinked = false;
                obj.isVisited = false;
                this.bubblesArray[row][col] = obj;
            }
        }
        // console.log("bubblesArray", this.bubblesArray)
    }

    /** 创造发射小球 */
    private _createOneShooter(): void {
        let b = instantiate(this.bubblePrefab);
        let color = Util.randNum(1, 4);
        b.getComponent(Bubble).init(this, this.shooter.position, this.bubbleSpriteFrame[color - 1]);
        // 设置对应数据
        let obj: bubbleData = Object.create(null);
        obj.node = b;
        obj.color = color;
        obj.isLinked = false;
        obj.isVisited = false;
        // 指定当前 shootBubble
        this.shootBubble = obj;
    }
}

