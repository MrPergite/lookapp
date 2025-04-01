import * as Haptics from "expo-haptics";

export function withHaptick(fn: Function) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    return function (...args: any[]) {
        fn(...args)
    }
}