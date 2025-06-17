import tailwindcss from '@tailwindcss/vite';
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default () => {
    // See https://github.com/nrwl/nx/issues/28978.
    const cwd = process.cwd();
    process.chdir(__dirname); // Temporarily change the working directory

    const config = defineConfig({
        plugins: [
            tailwindcss(),
            sveltekit(),
            paraglideVitePlugin({
                project: './project.inlang',
                outdir: './src/lib/paraglide'
            })
        ]
    });

    process.chdir(cwd); // Restore the original working directory
    return config;
};
