import { Editor, TinyMCE } from "tinymce";

declare const tinymce: TinyMCE;
interface menusOption {
  icon: string;
}

const eq = (t) => (a) => t === a;
const isNull = eq(null);
const first = (fn: (...args) => any, rate: number): any => {
  let timer = null;
  const cancel = () => {
    if (!isNull(timer)) {
      clearTimeout(timer);
      timer = null;
    }
  };
  const throttle = (...args) => {
    if (isNull(timer)) {
      timer = setTimeout(() => {
        timer = null;
        fn(...args);
      }, rate);
    }
  };
  const antiShaking = (...args) => {
    if (!isNull(timer)) {
      clearTimeout(timer);
      timer = null;
    }
    timer = setTimeout(() => {
      timer = null;
      fn(...args);
    }, rate);
  };
  return {
    cancel,
    throttle,
    antiShaking,
  };
};
const generateUUID = (type = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx") => {
  let d = new Date().getTime();

  return type.replace(/[xy]/g, function (c) {
    const r = (d + Math.random() * 16) % 16 | 0;

    d = Math.floor(d / 16);

    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
};
const addId = (arrays = []) => {
  arrays.forEach((item) => {
    item.id = "lqh_" + generateUUID("xxxxx");
  });
};
const toTree = (eleList = []) => {
  const tree = [];
  const level = 1;
  const copyArr = eleList.map(function (item) {
    return {
      hLevel: item.nodeName.slice(1),
      label: item.textContent,
      id: item.id,
    };
  });

  // 依据指定级别查找该级别的子孙级，并删除掉曾经查找到的子孙级
  const getChildrenByLevel = function (currentLevelItem, arr) {
    if (!currentLevelItem) {
      return null;
    }
    // 将level值转成正数，再进行比拟
    const minusCurrentLevel = -currentLevelItem.hLevel;
    const children = [];
    for (let i = 0, len = arr.length; i < len; i++) {
      const levelItem = arr[i];
      if (-levelItem.hLevel < minusCurrentLevel) {
        children.push(levelItem);
      } else {
        // 只找最近那些子孙级
        break;
      }
    }
    // 从数组中删除曾经找到的那些子孙级，免得影响到其余子孙级的查找
    if (children.length > 0) {
      arr.splice(0, children.length);
    }
    return children;
  };

  const getTree = function (result, arr, level) {
    while (arr.length > 0) {
      // 按从上到下的顺序,所以第一位可以不看级别
      // 首先将数组第一位移除掉，并增加到结果集中
      let currentItem = arr.shift();
      if (currentItem) {
        currentItem.level = level;
        result.push(currentItem);
      }
      if (!currentItem) {
        return;
      }
      // 依据以后级别获取它的子孙级
      const children = getChildrenByLevel(currentItem, arr);
      // 如果以后级别没有子孙级则开始下一个
      if (children.length === 0) {
        currentItem = arr.shift();
        if (currentItem) {
          currentItem.level = level;
          result.push(currentItem);
        }
        continue;
      }
      currentItem.children = [];
      // 查找到的子孙级持续查找子孙级
      getTree(currentItem.children, children, level + 1);
    }
  };

  getTree(tree, copyArr, level);

  return tree;
};

const setup = (editor: Editor, url: string): void => {
  const registerOption = editor.options.register;
  registerOption("outline_menus_updata", {
    processor: (value) => {
      return typeof value === "function" || value === false;
    },
    default: false,
  });
  registerOption("outline_menus_off", {
    processor: (value) => {
      return { value, valid: true };
    },
    default: true,
  });

  const menusOption: menusOption = editor.options.get<menusOption>(
    "outline_menus_option"
  );
  const createOutline = editor.options.get("outline_menus_updata");
  const offOutline = editor.options.get("outline_menus_off");

  const updated = function () {
    const hList = editor.dom.select("h1,h2,h3,h4,h5,p[data-directory]");
    addId(hList);
    const treeArray = toTree(hList);
    createOutline(editor, treeArray);
  };

  const debouncedUpdate = first(updated, 300);

  editor.on("keyup SetContent Undo Redo", debouncedUpdate.antiShaking);

  editor.addCommand("outlinemenusUpdata", () => updated());

  editor.addCommand("aiCreateDirectories", () => {
    const eleArray = editor.dom.select("h1,h2,h3,h4,h5,h6,p");
    console.log(eleArray);

    const regexp = /^(第|附件)?([零一二三四五六七八九十百千万]+)(条)?/m;
    eleArray.forEach((item) => {
      if (item.innerText && item.innerText !== "\n") {
        if (regexp.test(item.innerText) && !/(H[1-6])/g.test(item.tagName)) {
          item.dataset.directory = "no";
        }
      }
    });
    editor.execCommand("outlinemenusUpdata");
  });

  editor.ui.registry.addToggleButton("outlinemenus", {
    tooltip: "目录",
    icon: menusOption?.icon || "toc",
    onAction: (api) => {
      api.setActive(!api.isActive());
      offOutline(editor, api.isActive());
      if (api.isActive()) {
        editor.execCommand("outlinemenusUpdata");
      }
    },
  });
};

export default (): void => {
  tinymce.PluginManager.add("outlinemenus", setup);
};
