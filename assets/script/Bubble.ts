//小球
import { _decorator, Component, Node, Vec2, SpriteFrame, Sprite, Vec3, tween, Tween, math, v3, UIOpacity, UIOpacityComponent } from 'cc';
import { BubbleMgr } from './BubbleMgr';
const { ccclass, property } = _decorator;

@ccclass('Bubble')
export class Bubble extends UIOpacityComponent {
    // 父节点类
    @property
    private bubbleMgr: BubbleMgr = null;

    /** 初始化
     * @parm parent 管理者
     * @parm position 位置
     * @parm position 纹理
     */
    public init(parent: BubbleMgr, position: Vec3, spriteFrame: SpriteFrame): void {
        // parent.node.addChild(this.node);//添加到管理者节点下
        this.node.setParent(parent.node);//添加到管理者节点下,两种方法都可以
        this.bubbleMgr = parent;
        // this.node.position = position;
        this.node.setPosition(position)//改变它位置
        this.setSpriteFrame(spriteFrame);//赋予它纹理
    }

    /** 设置纹理 */
    public setSpriteFrame(spriteFrame: SpriteFrame): void {
        this.getComponent(Sprite).spriteFrame = spriteFrame;
    }

    /** 死亡动画 */
    public playDeathAnimation(index: Vec3): void {
        // this.node.runAction(
        //     sequence(
        //         // 膨胀后消除自己
        //         cc.scaleTo(0.1, 1.2),
        //         cc.scaleTo(0.1, 1.0),
        //         cc.callFunc(() => {
        //             // 将位置空出
        //             this.parent.bubblesArray[index.x][index.y] = undefined;
        //         }, this),
        //         cc.removeSelf()
        //     )
        // );
        // this.node.opacity
        console.log("playDeathAnimation1", index)
        tween(this.node)
            .to(0.1, { scale: v3(1.2, 1.2) })
            .to(0.1, { scale: v3(1, 1) })
            .call(() => {
                console.log("playDeathAnimation", index, this.bubbleMgr.bubblesArray[index.x][index.y])
                this.bubbleMgr.bubblesArray[index.x][index.y].node.destroy();
                this.bubbleMgr.bubblesArray[index.x][index.y] = null;
            })
            .start()
    }

    /** 下落动画 */
    public playDownAnimation(index: Vec3): void {
        let _node = this.bubbleMgr.bubblesArray[index.x][index.y].node
        tween(this.node.getComponent(UIOpacity))
            .to(0.5, { opacity: 0 })
            // .to(0.1, { scale: v3(1, 1) })
            .call(() => {
                this.bubbleMgr.bubblesArray[index.x][index.y].node.destroy();
                this.bubbleMgr.bubblesArray[index.x][index.y] = null;
            })
            .start()
        tween(this.node)
            .to(0.5, { position: v3(_node.position.x, -300) })
            .call(() => {
                // console.log("playDownAnimation", index, this.bubbleMgr.bubblesArray[index.x][index.y])
                // this.bubbleMgr.bubblesArray[index.x][index.y].node.destroy();
                // this.bubbleMgr.bubblesArray[index.x][index.y] = null;
            })
            .start()
    }
}

