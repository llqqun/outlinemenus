import { TinyMCE } from 'tinymce';

import Plugin from '../../main/ts/Plugin';

declare let tinymce: TinyMCE;

Plugin();

tinymce.init({
  selector: 'textarea.tinymce',
  plugins: 'code outlinemenus',
  toolbar: 'outlinemenus',
  height: 800,
  outline_menus_updata: (e, v) => {
    console.log(v);
  },
  outline_menus_off: (e, v) => {
    console.log(v);
    
  }
});
