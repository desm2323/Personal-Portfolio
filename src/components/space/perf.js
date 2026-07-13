/* True when WebGL is running on a software rasterizer (e.g. the browser's
   hardware acceleration is turned off → SwiftShader/llvmpipe). The scene
   starts in its low-power profile there; machines with no WebGL at all are
   handled separately by the fallback page. */
export const detectSoftwareGL = () => {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        if (!gl) return false;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const renderer = String(
            (ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)) || ''
        );
        return /swiftshader|llvmpipe|software|basic render/i.test(renderer);
    } catch {
        return false;
    }
};
