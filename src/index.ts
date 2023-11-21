interface UniversalProfileExtensionEthereumProvider {
  isUniversalProfileExtension?: boolean;
  once(eventName: string | symbol, listener: (...args: any[]) => void): this;
  on(eventName: string | symbol, listener: (...args: any[]) => void): this;
  off(eventName: string | symbol, listener: (...args: any[]) => void): this;
  addListener(eventName: string | symbol, listener: (...args: any[]) => void): this;
  removeListener(eventName: string | symbol, listener: (...args: any[]) => void): this;
  removeAllListeners(event?: string | symbol): this;
}

interface Window {
  lukso?: UniversalProfileExtensionEthereumProvider;
}

export = detectEthereumProvider;

/**
 * Returns a Promise that resolves to the value of window.ethereum if it is
 * set within the given timeout, or null.
 * The Promise will not reject, but an error will be thrown if invalid options
 * are provided.
 *
 * @param options - Options bag.
 * @param options.mustBeUniversalProfileExtension - Whether to only look for UniversalProfileExtension providers.
 * Default: false
 * @param options.silent - Whether to silence console errors. Does not affect
 * thrown errors. Default: false
 * @param options.timeout - Milliseconds to wait for 'ethereum#initialized' to
 * be dispatched. Default: 3000
 * @returns A Promise that resolves with the Provider if it is detected within
 * given timeout, otherwise null.
 */
function detectEthereumProvider<T = UniversalProfileExtensionEthereumProvider>({
  mustBeUniversalProfileExtension = false,
  silent = false,
  timeout = 3000,
} = {}): Promise<T | null> {

  _validateInputs();

  let handled = false;

  return new Promise((resolve) => {
    if ((window as Window).lukso) {

      handleLukso();

    } else {

      window.addEventListener(
        'lukso#initialized',
        handleLukso,
        { once: true },
      );

      setTimeout(() => {
        handleLukso();
      }, timeout);
    }

    function handleLukso() {

      if (handled) {
        return;
      }
      handled = true;

      window.removeEventListener('lukso#initialized', handleLukso);

      const { lukso } = window as Window;

      if (lukso && (!mustBeUniversalProfileExtension || lukso.isUniversalProfileExtension)) {
        resolve(lukso as unknown as T);
      } else {

        const message = mustBeUniversalProfileExtension && lukso
          ? 'Non-UniversalProfileExtension window.lukso detected.'
          : 'Unable to detect window.lukso.';

        !silent && console.error('@spencermeta/universal-profile-detect-provider:', message);
        resolve(null);
      }
    }
  });

  function _validateInputs() {
    if (typeof mustBeUniversalProfileExtension !== 'boolean') {
      throw new Error(`@spencermeta/universal-profile-detect-provider: Expected option 'mustBeUniversalProfileExtension' to be a boolean.`);
    }
    if (typeof silent !== 'boolean') {
      throw new Error(`@spencermeta/universal-profile-detect-provider: Expected option 'silent' to be a boolean.`);
    }
    if (typeof timeout !== 'number') {
      throw new Error(`@spencermeta/universal-profile-detect-provider: Expected option 'timeout' to be a number.`);
    }
  }
}
