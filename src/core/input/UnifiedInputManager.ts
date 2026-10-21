import type { InputAction } from '../engine/types';

export type InputCallback = (action: InputAction) => void;

export class UnifiedInputManager {
  private listener: InputCallback | null = null;
  private releaseListener: InputCallback | null = null;
  private isListening = false;
  private activeActions = new Set<InputAction>();

  public setListener(pressCallback: InputCallback, releaseCallback?: InputCallback): void {
    this.listener = pressCallback;
    if (releaseCallback) {
      this.releaseListener = releaseCallback;
    }
    if (!this.isListening) {
      this.attachKeyboardListener();
    }
  }

  public setReleaseListener(releaseCallback: InputCallback): void {
    this.releaseListener = releaseCallback;
  }

  public removeListener(): void {
    this.listener = null;
    this.releaseListener = null;
    this.clearAllActiveActions();
    this.detachKeyboardListener();
  }

  public isActionActive(action: InputAction): boolean {
    return this.activeActions.has(action);
  }

  public clearAllActiveActions(): void {
    if (this.releaseListener && this.activeActions.size > 0) {
      for (const action of this.activeActions) {
        this.releaseListener(action);
      }
    }
    this.activeActions.clear();
  }

  public static getHapticsEnabled(): boolean {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('retropocket_haptics') !== 'false';
  }

  public static setHapticsEnabled(enabled: boolean): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('retropocket_haptics', String(enabled));
    }
  }

  /**
   * Dispatch action from virtual keypad (mobile UI) with safe haptic feedback
   */
  public dispatch(action: InputAction): void {
    if (UnifiedInputManager.getHapticsEnabled() && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(15);
      } catch {
        // Safe fallback if permission denied
      }
    }
    this.activeActions.add(action);
    if (this.listener) {
      this.listener(action);
    }
  }

  /**
   * Dispatch release action from virtual keypad (finger lifted)
   */
  public dispatchRelease(action: InputAction): void {
    this.activeActions.delete(action);
    if (this.releaseListener) {
      this.releaseListener(action);
    }
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    // Prevent default scroll behavior for game keys
    const preventKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'];
    if (preventKeys.includes(e.code)) {
      e.preventDefault();
    }

    const action = this.mapKeyCodeToAction(e.code, e.key);
    if (action) {
      this.activeActions.add(action);
      if (this.listener) {
        this.listener(action);
      }
    }
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    const action = this.mapKeyCodeToAction(e.code, e.key);
    if (action) {
      this.activeActions.delete(action);
      if (this.releaseListener) {
        this.releaseListener(action);
      }
    }
  };

  private handleBlur = (): void => {
    this.clearAllActiveActions();
  };

  private attachKeyboardListener(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.handleKeyDown);
      window.addEventListener('keyup', this.handleKeyUp);
      window.addEventListener('blur', this.handleBlur);
      this.isListening = true;
    }
  }

  private detachKeyboardListener(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.handleKeyDown);
      window.removeEventListener('keyup', this.handleKeyUp);
      window.removeEventListener('blur', this.handleBlur);
      this.isListening = false;
    }
  }

  private mapKeyCodeToAction(code: string, key: string): InputAction | null {
    switch (code) {
      case 'ArrowUp':
      case 'KeyW':
      case 'Numpad8':
        return 'UP';
      case 'ArrowDown':
      case 'KeyS':
      case 'Numpad2':
        return 'DOWN';
      case 'ArrowLeft':
      case 'KeyA':
      case 'Numpad4':
        return 'LEFT';
      case 'ArrowRight':
      case 'KeyD':
      case 'Numpad6':
        return 'RIGHT';
      case 'Space':
      case 'Enter':
      case 'Numpad5':
        return 'ACTION';
      case 'Escape':
      case 'Backspace':
      case 'KeyQ':
        return 'SOFT_LEFT';
      case 'KeyE':
        return 'SOFT_RIGHT';
      default:
        break;
    }

    // Number key mappings (Both top row & numpad)
    switch (key) {
      case '1': return 'NUM_1';
      case '2': return 'NUM_2';
      case '3': return 'NUM_3';
      case '4': return 'NUM_4';
      case '5': return 'NUM_5';
      case '6': return 'NUM_6';
      case '7': return 'NUM_7';
      case '8': return 'NUM_8';
      case '9': return 'NUM_9';
      case '0': return 'NUM_0';
      case '*': return 'NUM_STAR';
      case '#': return 'NUM_HASH';
      default: return null;
    }
  }
}

