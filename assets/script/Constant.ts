import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Constant')
export class Constant {
    
}

/** 导出事件名称枚举 */
export enum EVENT {
    /** 触摸结束后，射击事件，附带角度参数 */
    TOUCHEND_SHOOT = 'shoot'
}