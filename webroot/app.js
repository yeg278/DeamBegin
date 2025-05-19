// 全局变量
const CONFIG_FILE_PATH = '/data/adb/modules/DeamsBegin/applist.conf';
let appBindings = [];
let activeApp = null;
let actionRunning = false;
let autoSaveEnabled = true;
let appNames = {}; // 存储应用包名与应用名称的映射
let currentEditPackage = ""; // 当前正在编辑应用名的包名
let ksuApi = null; // KernelSU API对象
let currentTheme = 'system'; // 'system', 'light', 'dark'

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', async () => {
    console.log('页面加载完成，开始初始化');
    
    try {
        // 添加自定义模态框样式
        addCustomModalStyles();
        
        // 初始化KernelSU API
        await initKernelSUApi();
    
        // 绑定事件监听器
    bindEvents();
    
    // 应用涟漪效果
    applyRippleEffect();
    
        // 加载用户主题偏好
    loadThemePreference();
    
        // 载入配置
    await loadConfig();
        
        // 确保添加应用按钮能正常工作
        ensureAddAppButtonWorks();
    } catch (error) {
        console.error('初始化失败:', error);
        showToast('初始化失败，请检查权限或刷新页面', 'error');
    }
});

// 设置全局错误处理
function setupErrorHandling() {
    // 捕获未处理的Promise错误
    window.addEventListener('unhandledrejection', function(event) {
        console.error('未处理的Promise错误:', event.reason);
        // 防止连续显示多个错误提示
        if (!window._lastErrorTime || Date.now() - window._lastErrorTime > 5000) {
            showToast('操作失败: ' + (event.reason.message || '未知错误'), 'error');
            window._lastErrorTime = Date.now();
        }
    });
    
    // 捕获全局JavaScript错误
    window.addEventListener('error', function(event) {
        console.error('JavaScript错误:', event.message, 'at', event.filename, ':', event.lineno);
        // 防止连续显示多个错误提示
        if (!window._lastErrorTime || Date.now() - window._lastErrorTime > 5000) {
            showToast('页面发生错误，请刷新重试', 'error');
            window._lastErrorTime = Date.now();
        }
        // 阻止错误传播
        event.preventDefault();
    });
}

// 显示致命错误
function showFatalError(title, message) {
    hideLoading(); // 确保隐藏加载提示
    
    // 创建错误对话框
    const errorDiv = document.createElement('div');
    errorDiv.className = 'fatal-error-overlay';
    errorDiv.innerHTML = `
        <div class="fatal-error-container">
            <i class="material-icons-round error-icon">error</i>
            <h2>${title}</h2>
            <p>${message}</p>
            <div class="error-actions">
                <button class="btn btn-primary" id="error-reload">刷新应用</button>
            </div>
        </div>
    `;
    
    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
        .fatal-error-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
        }
        .fatal-error-container {
            background-color: white;
            border-radius: 8px;
            padding: 24px;
            max-width: 80%;
            text-align: center;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }
        .error-icon {
            font-size: 48px;
            color: #f44336;
            margin-bottom: 16px;
        }
        .error-actions {
            margin-top: 24px;
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(errorDiv);
    
    // 添加刷新按钮事件处理
    document.getElementById('error-reload').addEventListener('click', function() {
        window.location.reload();
    });
}

// 启动应用健康监测
function startAppHealthMonitor() {
    // 监测API可用性
    setInterval(async () => {
        try {
            // 如果已经知道API不可用，就不再重复检测
            if (window._apiAvailable === false) return;
            
            // 尝试执行一个简单的命令
            const result = await execCommand('echo "health_check"');
            if (result && result.includes("health_check")) {
                if (window._apiAvailable === undefined) {
                    console.log("API健康检查：API可用");
                    window._apiAvailable = true;
                }
            } else {
                throw new Error("API响应异常");
            }
        } catch (error) {
            console.error("API健康检查失败:", error);
            if (window._apiAvailable !== false) {
                window._apiAvailable = false;
                showToast("KernelSU API连接已断开，部分功能可能不可用", "warning");
            }
        }
    }, 30000); // 每30秒检测一次
    
    // 监测WebView状态
    if (document.body.classList.contains('is-webview')) {
        // 设置心跳检测，确保WebView仍然活跃
        let lastHeartbeat = Date.now();
        
        // 更新心跳时间
        const updateHeartbeat = () => { lastHeartbeat = Date.now(); };
        
        // 各种用户交互都更新心跳
        window.addEventListener('click', updateHeartbeat);
        window.addEventListener('touchstart', updateHeartbeat);
        window.addEventListener('scroll', updateHeartbeat);
        
        // 检测WebView是否仍然响应
        setInterval(() => {
            const now = Date.now();
            // 如果超过5分钟没有交互，可能WebView已冻结
            if (now - lastHeartbeat > 300000) {
                console.log("WebView可能已冻结，尝试恢复...");
                // 尝试通过执行一个空操作来"唤醒"WebView
                document.body.style.opacity = '0.999';
                setTimeout(() => { document.body.style.opacity = '1'; }, 100);
            }
        }, 60000); // 每分钟检测一次
    }
}

// 检测浏览器环境和兼容性
function detectBrowserEnvironment() {
    try {
        // 获取用户代理信息
        const userAgent = navigator.userAgent || '';
        const appVersion = navigator.appVersion || '';
        console.log("User-Agent:", userAgent);
        
        // 添加平台信息到body类，用于CSS适配
        const body = document.body;
        
        // 检测是否为移动设备
        if (/Mobile|Android|iPhone|iPad|iPod|Windows Phone/i.test(userAgent)) {
            body.classList.add('is-mobile');
            
            // 检测Android版本
            const androidMatch = userAgent.match(/Android (\d+)\.(\d+)/i);
            if (androidMatch) {
                const majorVersion = parseInt(androidMatch[1]);
                body.classList.add('android');
                body.classList.add(`android-${majorVersion}`);
                
                // 对低版本Android特殊处理
                if (majorVersion < 7) {
                    body.classList.add('legacy-android');
                    console.log("检测到低版本Android，启用兼容模式");
                }
            }
            
            // 检测iOS版本
            if (/iPhone|iPad|iPod/i.test(userAgent)) {
                body.classList.add('ios');
                const iosMatch = userAgent.match(/OS (\d+)_(\d+)/i);
                if (iosMatch) {
                    body.classList.add(`ios-${iosMatch[1]}`);
                }
            }
        } else {
            body.classList.add('is-desktop');
        }
        
        // 检测WebView
        if (/wv|WebView/i.test(userAgent)) {
            body.classList.add('is-webview');
            console.log("检测到WebView环境");
            
            // 为WebView添加viewport修复
            fixWebViewViewport();
        }
        
        console.log("环境检测完成");
    } catch (error) {
        console.error("环境检测失败:", error);
    }
}

// 修复WebView的viewport设置
function fixWebViewViewport() {
    // 查找viewport meta标签
    let viewport = document.querySelector('meta[name="viewport"]');
    
    // 如果没有找到，就创建一个新的
    if (!viewport) {
        viewport = document.createElement('meta');
        viewport.name = 'viewport';
        document.head.appendChild(viewport);
    }
    
    // 设置合适的viewport参数，确保WebView中正确显示
    viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
    
    // 添加额外的WebView兼容性样式
    const style = document.createElement('style');
    style.textContent = `
        /* WebView 兼容性修复 */
        body.is-webview {
            /* 防止WebView缩放问题 */
            -webkit-text-size-adjust: 100%;
            /* 修复部分WebView上的点击延迟 */
            touch-action: manipulation;
        }
        /* 修复一些WebView上的文本渲染问题 */
        body.is-webview * {
            -webkit-font-smoothing: antialiased;
        }
    `;
    document.head.appendChild(style);
}

// 初始化KernelSU API
async function initKernelSUApi() {
    try {
        // 尝试多种方式获取KernelSU API
        if (typeof kernelsu !== 'undefined') {
            // 优先使用官方推荐的导入方式
            ksuApi = kernelsu;
            console.log("使用kernelsu包API");
        } else if (typeof ksu !== 'undefined') {
            // 兼容旧的调用方式
            ksuApi = ksu;
            console.log("使用ksu全局对象API");
        } else {
            // 降级处理
            console.log("未检测到KernelSU API，使用模拟API");
            ksuApi = {
                exec: function(cmd, opts, callback) {
                    console.log("模拟执行命令:", cmd);
                    if (typeof callback === 'string') {
                        window[callback](1, "模拟输出 - KernelSU API未加载", "无法访问KernelSU API");
                    }
                    return { errno: 1, stdout: "", stderr: "无法访问KernelSU API" };
                },
                toast: function(msg) {
                    // 使用DOM显示消息
                    showToast(msg, "info");
                }
            };
        }
    } catch (error) {
        console.error("初始化KernelSU API失败:", error);
        showToast("初始化KernelSU API失败，部分功能可能无法使用", "error");
    }
}

// 添加自定义模态框样式
function addCustomModalStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* 模态框容器样式 */
        .modal.active {
            position: fixed; 
            top: 0; left: 0; 
            width: 100%; height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            background-color: var(--background-color);
        }
        
        /* 模态框内容区样式 - 添加圆角和统一边框 */
        .modal.active .modal-content {
            width: 96%;
            max-width: 500px;
            max-height: 90vh;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            /* 添加圆角和边框 */
            border: 1px solid var(--border-color, #ccc) !important;
            border-radius: 12px !important;
            box-shadow: none !important;
            outline: none !important;
            background-color: var(--background-color);
            /* 确保内部没有多余间距 */
            padding: 0 !important;
            overflow: hidden;
        }
        
        /* 模态框主体内容区域 */
        .modal.active .modal-body {
            overflow-y: auto;
            flex-grow: 1;
            padding: var(--spacing-lg);
            background-color: var(--background-color);
            /* 确保内容区域没有边距 */
            margin: 0;
        }
        
        /* 模态框头部和底部 */
        .modal.active .modal-header,
        .modal.active .modal-footer {
            flex-shrink: 0;
            padding: var(--spacing-lg);
            background-color: var(--background-color);
            border: none !important;
            /* 确保头部和底部没有边距 */
            margin: 0;
            width: 100%;
        }
        
        /* 保证头部和底部的圆角与外部一致 */
        .modal.active .modal-header {
            border-top-left-radius: 12px !important;
            border-top-right-radius: 12px !important;
        }
        
        .modal.active .modal-footer {
            border-bottom-left-radius: 12px !important;
            border-bottom-right-radius: 12px !important;
        }
        
        /* 表单元素统一背景色 */
        .modal.active input,
        .modal.active select,
        .modal.active textarea,
        .modal.active .form-control {
            background-color: var(--form-bg, #f5f7fa) !important;
            border-radius: 6px !important;
        }
        
        /* 进程/线程行布局 - 保持不变 */
        .process-item {
             margin-bottom: var(--spacing-sm);
        }
        .process-input-container {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm);
            flex-wrap: nowrap;
        }
        .binding-type-wrapper {
            flex: 0 0 110px;
        }
        .process-input-wrapper {
            flex: 1 1 auto;
            min-width: 80px;
        }
        .cores-input-wrapper {
            flex: 1 1 auto;
            min-width: 80px;
        }
        .binding-type-wrapper .form-control,
        .process-input-wrapper .form-control,
        .cores-input-wrapper .form-control {
            width: 100%;
        }
        .remove-process {
            flex: 0 0 auto;
            margin-left: var(--spacing-xs);
        }
        
        /* 配置对比界面样式 */
        .config-comparison {
            margin: 12px 0;
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid var(--border-color, #eee);
        }
        .config-comparison-header {
            display: flex;
            padding: 8px 12px;
            background-color: var(--background-alt, #f5f7fa);
            border-bottom: 1px solid var(--border-color, #eee);
        }
        .config-comparison-column {
            flex: 1;
            font-weight: bold;
            text-align: center;
        }
        .config-comparison-row {
            display: flex;
            border-bottom: 1px solid var(--border-color, #eee);
        }
        .config-comparison-row:last-child {
            border-bottom: none;
        }
        .config-comparison-cell {
            flex: 1;
            padding: 8px 12px;
            word-break: break-all;
        }
        .config-comparison-cell.current {
            background-color: rgba(76, 175, 80, 0.1);
        }
        .config-comparison-cell.imported {
            background-color: rgba(33, 150, 243, 0.1);
        }
        .import-status-badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 12px;
            margin-left: 6px;
        }
        .import-status-badge.new {
            background-color: #4CAF50;
            color: white;
        }
        .import-status-badge.existing {
            background-color: #2196F3;
            color: white;
        }
        .import-status-badge.no-name {
            background-color: #FFC107;
            color: black;
        }
    `;
    document.head.appendChild(style);
}

// 绑定事件处理函数
function bindEvents() {
    console.log('绑定事件处理函数...');
    
    // 保存按钮
    const saveBtn = document.getElementById('save-btn') || document.getElementById('save-config-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveConfig);
        console.log('已绑定保存按钮事件');
    } else {
        console.error('未找到保存按钮元素');
    }
    
    // 添加应用按钮
    const addAppBtn = document.getElementById('add-app-btn');
    if (addAppBtn) {
        console.log('找到添加应用按钮，绑定事件');
        addAppBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('添加应用按钮被点击');
            showAddAppModal();
        });
    } else {
        console.error('未找到添加应用按钮元素');
    }
    
    // 悬浮菜单的添加应用按钮（如果存在）
    const fabAddBtn = document.querySelector('.fab-menu-item.add');
    if (fabAddBtn) {
        console.log('找到悬浮菜单添加按钮，绑定事件');
        fabAddBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('悬浮菜单添加按钮被点击');
            showAddAppModal();
        });
    }
    
    // 搜索按钮
    document.getElementById('search-btn').addEventListener('click', searchApps);
    
    // 帮助按钮
    document.getElementById('help-btn').addEventListener('click', showHelpModal);
    
    // 刷新配置按钮 (新添加)
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            console.log('刷新配置按钮被点击');
            await loadConfig(); // 调用加载配置函数
        });
        console.log('已绑定刷新配置按钮事件');
    } else {
        console.warn('未找到刷新配置按钮元素 (refresh-btn)'); // 使用 warn 避免认为是严重错误
    }
    
    // 搜索输入框回车事件
    document.getElementById('search-input').addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            searchApps();
        }
    });
    
    // 添加应用模态框按钮
    document.getElementById('add-app-confirm').addEventListener('click', addNewApp);
    document.getElementById('add-app-cancel').addEventListener('click', hideAddAppModal);
    document.getElementById('close-add-app-modal').addEventListener('click', hideAddAppModal);
    
    // 添加进程/线程按钮
    const addProcessBtn = document.getElementById('add-process-btn');
    if (addProcessBtn) {
        addProcessBtn.addEventListener('click', function() {
            addProcessItem();
            // 确保新添加的项也自动隐藏输入框
            const newItem = document.querySelector('.process-item:last-child');
            if (newItem) {
                const bindingTypeSelect = newItem.querySelector('.binding-type');
                bindingTypeSelect.dispatchEvent(new Event('change'));
            }
        });
    }
    
    // 编辑应用名模态框按钮
    document.getElementById('edit-name-confirm').addEventListener('click', saveAppName);
    document.getElementById('edit-name-cancel').addEventListener('click', hideEditNameModal);
    document.getElementById('close-edit-name-modal').addEventListener('click', hideEditNameModal);
    
    // 编辑绑定模态框按钮
    document.getElementById('edit-binding-confirm').addEventListener('click', saveBindingChanges);
    document.getElementById('edit-binding-cancel').addEventListener('click', hideEditBindingModal);
    document.getElementById('close-edit-binding-modal').addEventListener('click', hideEditBindingModal);
    
    // 绑定类型选择切换
    document.getElementById('edit-binding-type').addEventListener('change', toggleBindingTypeFields);
    
    // 帮助模态框按钮
    document.getElementById('close-help-btn').addEventListener('click', hideHelpModal);
    document.getElementById('close-help-modal').addEventListener('click', hideHelpModal);
    
    // 确认对话框按钮
    document.getElementById('confirm-yes').addEventListener('click', function() {
        hideConfirmDialog();
    });
    document.getElementById('confirm-no').addEventListener('click', function() {
        hideConfirmDialog();
    });
    document.getElementById('confirm-close').addEventListener('click', function() {
        hideConfirmDialog();
    });

    // 主题切换按钮
    const themeSwitcherBtn = document.getElementById('theme-switcher-btn');
    if (themeSwitcherBtn) {
        console.log('找到主题切换按钮，绑定事件');
        themeSwitcherBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation(); // 阻止事件冒泡，防止与其他事件冲突
            console.log('主题切换按钮被点击');
            toggleTheme();
        });
    } else {
        console.error('未找到主题切换按钮');
    }

    // 监听系统颜色方案变化
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
        if (currentTheme === 'system') {
            applyTheme('system'); // 重新应用系统主题
        }
    });
}

// --- 主题切换功能 Start ---

// 应用指定主题
function applyTheme(theme) {
    const body = document.body;
    body.classList.remove('dark-mode', 'light-mode'); // 先移除所有主题类
    
    let finalTheme = theme;
    if (theme === 'system') {
        finalTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    if (finalTheme === 'dark') {
        body.classList.add('dark-mode');
        console.log('应用深色主题');
    } else {
        body.classList.add('light-mode'); // 添加 light-mode 用于区分强制浅色
        console.log('应用浅色主题');
    }
    
    // 更新按钮图标和状态 (稍后实现)
    updateThemeSwitcherIcon(theme);

    // 尝试通知MMRL更新状态栏
    if (typeof $AppOpt !== 'undefined' && typeof $AppOpt.setLightStatusBars === 'function') {
        try {
            $AppOpt.setLightStatusBars(finalTheme === 'light');
        } catch (error) {
            console.error('更新状态栏主题失败:', error);
        }
    }
}

// 切换主题 (system -> dark -> light -> system)
function toggleTheme() {
    console.log('切换主题函数被调用，当前主题:', currentTheme);
    if (currentTheme === 'system') {
        currentTheme = 'dark';
    } else if (currentTheme === 'dark') {
        currentTheme = 'light';
    } else { // currentTheme === 'light'
        currentTheme = 'system';
    }
    
    console.log('切换后的主题:', currentTheme);
    applyTheme(currentTheme);
    
    // 保存用户偏好
    try {
        localStorage.setItem('themePreference', currentTheme);
        console.log('主题偏好已保存:', currentTheme);
    } catch (e) {
        console.error('无法保存主题偏好到localStorage:', e);
    }
}

// 加载用户主题偏好或系统设置
function loadThemePreference() {
    let savedTheme = 'system'; // 默认为跟随系统
    try {
        savedTheme = localStorage.getItem('themePreference') || 'system';
    } catch (e) {
        console.error('无法从localStorage读取主题偏好:', e);
    }
    currentTheme = savedTheme;
    console.log('加载主题偏好:', currentTheme);
    applyTheme(currentTheme);
}

// 更新主题切换按钮图标
function updateThemeSwitcherIcon(theme) {
    const iconElement = document.querySelector('#theme-switcher-btn i');
    const textElement = document.querySelector('#theme-switcher-btn span');
    if (!iconElement || !textElement) return;

    let iconName = '';
    let themeText = '';
    
    switch (theme) {
        case 'dark':
            iconName = 'dark_mode';
            themeText = '深色模式';
            break;
        case 'light':
            iconName = 'light_mode';
            themeText = '浅色模式';
            break;
        default: // 'system'
            iconName = 'brightness_auto'; // 或者 'brightness_6' 
            themeText = '跟随系统';
            break;
    }
    
    iconElement.textContent = iconName;
    textElement.textContent = themeText;
}

// --- 主题切换功能 End ---


// 获取绑定类型组合
function getBindingTypes(currentBindings, importedBindings) {
    const types = {};
    
    // 添加现有绑定的类型
    currentBindings.forEach(binding => {
        let typeKey = 'main';
        let typeName = '主进程';
        
        if (binding.processName) {
            typeKey = `process:${binding.processName}`;
            typeName = `子进程 ${binding.processName}`;
        } else if (binding.threadName) {
            typeKey = `thread:${binding.threadName}`;
            typeName = `线程 ${binding.threadName}`;
        }
        
        types[typeKey] = typeName;
    });
    
    // 添加导入绑定的类型
    importedBindings.forEach(binding => {
        let typeKey = 'main';
        let typeName = '主进程';
        
        if (binding.processName) {
            typeKey = `process:${binding.processName}`;
            typeName = `子进程 ${binding.processName}`;
        } else if (binding.threadName) {
            typeKey = `thread:${binding.threadName}`;
            typeName = `线程 ${binding.threadName}`;
        }
        
        types[typeKey] = typeName;
    });
    
    return types;
}

// 根据类型查找绑定
function findBindingByType(bindings, typeKey) {
    if (typeKey === 'main') {
        return bindings.find(b => !b.processName && !b.threadName);
    } else if (typeKey.startsWith('process:')) {
        const processName = typeKey.substring(8);
        return bindings.find(b => b.processName === processName);
    } else if (typeKey.startsWith('thread:')) {
        const threadName = typeKey.substring(7);
        return bindings.find(b => b.threadName === threadName);
    }
    return null;
}

// 替换重叠的绑定
function replaceOverlappingBindings(overlappingBindings, importedAppNames) {
    for (const packageName in overlappingBindings) {
        const data = overlappingBindings[packageName];
        
        // 删除当前所有相关绑定
        appBindings = appBindings.filter(binding => binding.packageName !== packageName);
        
        // 重新分配ID并添加导入的绑定
        data.imported.forEach(binding => {
            binding.id = generateId(); // 重新生成ID
            appBindings.push(binding);
        });
        
        // 保留应用名称（如果有）
        if (importedAppNames && importedAppNames[packageName]) {
            appNames[packageName] = importedAppNames[packageName];
        }
    }
}

// 导入新绑定
function importNewBindings(newBindings) {
    newBindings.forEach(binding => {
        // 重新生成ID
        binding.id = generateId();
        
        // 添加到全局绑定
        appBindings.push(binding);
        
        // 设置应用名称（如果有）
        if (binding.appName) {
            appNames[binding.packageName] = binding.appName;
            delete binding.appName; // 移除临时属性
        }
    });
}

// 隐藏确认对话框
function hideConfirmDialog() {
    const confirmDialog = document.getElementById('custom-confirm');
    confirmDialog.classList.remove('active');
}

// 加载配置文件
async function loadConfig() {
    showLoading();
    
    try {
        // 检查配置文件是否存在
        const checkResult = await execCommand(`[ -f ${CONFIG_FILE_PATH} ] && echo "exists" || echo "not exists"`);
        
        if (checkResult.trim() === 'exists') {
            // 读取配置文件
            const configContent = await execCommand(`cat ${CONFIG_FILE_PATH}`);
            parseConfig(configContent);
        
            // 更新UI
            updateBindingsList();
            
            showToast('配置已加载', 'success');
        } else {
            // 创建默认配置
            showToast('配置文件不存在，将创建默认配置', 'info');
            createDefaultConfig();
        }
    } catch (error) {
        console.error('加载配置失败:', error);
        showToast('加载配置失败', 'error');
        
        // 创建默认配置
        createDefaultConfig();
    } finally {
        hideLoading();
    }
}

// 创建默认配置
function createDefaultConfig() {
    // 设置默认值
    appBindings = [];
    appNames = {};
    
    // 更新UI
    updateBindingsList();
}

// 解析配置文件
function parseConfig(configText) {
    // 清空现有绑定和应用名
    appBindings = [];
    appNames = {};
    
    // 按行解析
    const lines = configText.split('\n');
    let currentComment = null;
    let currentAppName = null;
    let currentPackageName = null;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // 跳过空行
        if (!line) continue;
        
        // 处理注释行
        if (line.startsWith('#')) {
            const comment = line.substring(1).trim();
            
            // 如果下一行包含等号且不是核心组配置，视为应用名
            if (i + 1 < lines.length) {
                const nextLine = lines[i + 1].trim();
                if (nextLine && nextLine.includes('=') && !isCoreSetting(nextLine.split('=')[0].trim())) {
                    const packageName = nextLine.split('=')[0].trim().split(/[:{\[]/)[0].trim();
                    currentAppName = comment;
                    appNames[packageName] = currentAppName;
                    continue;
                }
            }
            
            // 普通注释
            currentComment = comment;
            continue;
        }
        
        // 检查是否包含等号（绑定规则）
        if (line.includes('=')) {
            const parts = line.split('=');
            const target = parts[0].trim();
            const cores = parts[1].trim();
            
            // 跳过核心组配置
            if (isCoreSetting(target)) {
                continue;
            }
        
            // 解析标准绑定规则
            const binding = parseBindingRule(target, cores, currentComment);
            if (binding) {
                appBindings.push(binding);
            }
            
            // 每次处理完一条规则后重置注释
            currentComment = null;
        }
    }
}

// 检查是否为核心组设置
function isCoreSetting(target) {
    return target === 'small_cores' || target === '小核' ||
           target === 'medium_cores' || target === '中核' ||
           target === 'big_cores' || target === '大核' ||
           target === 'super_cores' || target === '超核';
}

// 解析绑定规则
function parseBindingRule(target, cores, comment) {
    let packageName = target;
    let processName = '';
    let threadName = '';
    
    // 检查是否包含进程名（com.example.app:process）
    if (target.includes(':') && !target.includes('{')) {
        const parts = target.split(':');
        packageName = parts[0];
        processName = ':' + parts[1];
    } 
    // 检查是否包含线程名（com.example.app{Thread}）
    else if (target.includes('{') && target.includes('}')) {
        const packagePart = target.split('{')[0];
        const threadPart = target.substring(target.indexOf('{') + 1, target.indexOf('}'));
        packageName = packagePart;
        threadName = threadPart;
    }
    
    return {
        packageName: packageName,
        processName: processName,
        threadName: threadName,
        cores: cores,
        comment: comment || '',
        id: generateId()
    };
}

// 验证核心输入格式
function validateCoreInput(input) {
    if (!input) return false;
    
    // 允许的格式: "0-3", "0,1,2,3", "0-2,4,6-7"
    const pattern = /^(\d+(-\d+)?)(,\d+(-\d+)?)*$/;
    return pattern.test(input);
}

// 更新绑定列表
function updateBindingsList(searchText = '') {
    const appListContainer = document.getElementById('app-list');
    appListContainer.innerHTML = '';
    
    // 按包名排序
    appBindings.sort((a, b) => a.packageName.localeCompare(b.packageName));
    
    // 按包名的首字母或分类字符进行分组
    const appGroups = {};
    
    // 创建已存在的应用的映射
    const appPackages = new Set();
    
    // 筛选匹配搜索文本的绑定
    const filteredBindings = searchText ? 
        appBindings.filter(binding => 
            binding.packageName.toLowerCase().includes(searchText.toLowerCase()) || 
            binding.threadName.toLowerCase().includes(searchText.toLowerCase()) ||
            binding.processName.toLowerCase().includes(searchText.toLowerCase()) ||
            (appNames[binding.packageName] && appNames[binding.packageName].toLowerCase().includes(searchText.toLowerCase()))
        ) : 
        appBindings;
    
    // 先按包名分组
    for (const binding of filteredBindings) {
        if (!appPackages.has(binding.packageName)) {
            appPackages.add(binding.packageName);
            
            // 获取包名的分类字符（取首字母或首字符）
            let category = binding.packageName.charAt(0).toUpperCase();
            
            // 如果是数字，归类到 "0-9" 分组
            if (/^\d$/.test(category)) {
                category = '0-9';
            }
            
            // 如果是特殊字符，归类到 "#" 分组
            if (!/^[A-Z0-9]$/.test(category)) {
                category = '#';
            }
            
            if (!appGroups[category]) {
                appGroups[category] = [];
            }
            
            appGroups[category].push(binding.packageName);
        }
    }
    
    // 如果没有找到匹配项
    if (Object.keys(appGroups).length === 0) {
        appListContainer.innerHTML = `
            <div class="app-empty">
                <i class="material-icons-round">search_off</i>
                <p>未找到匹配的应用</p>
            </div>
        `;
        return;
    }
    
    // 按分类字母排序
    const sortedCategories = Object.keys(appGroups).sort((a, b) => {
        // 特殊分类排在最后
        if (a === '#') return 1;
        if (b === '#') return -1;
        if (a === '0-9') return b === '#' ? -1 : 1;
        if (b === '0-9') return a === '#' ? 1 : -1;
        return a.localeCompare(b);
    });
    
    // 为每个分类创建一个区块
    for (const category of sortedCategories) {
        // 创建分类标题
        const categoryHeader = document.createElement('div');
        categoryHeader.className = 'category-header';
        categoryHeader.textContent = category;
        appListContainer.appendChild(categoryHeader);
        
        // 为该分类下的每个应用创建卡片
        const applCard = document.createElement('div');
        applCard.className = 'card';
        appListContainer.appendChild(applCard);
        
        for (const packageName of appGroups[category].sort()) {
            renderAppItem(packageName, applCard);
        }
    }
}

// 渲染应用项
function renderAppItem(packageName, container) {
    // 创建应用项
    const appItem = document.createElement('div');
    appItem.className = 'app-item';
    appItem.dataset.package = packageName;
    
    // 应用信息
    const appInfo = document.createElement('div');
    appInfo.className = 'app-info';
    
    // 应用名称和包名
    const appName = document.createElement('div');
    appName.className = 'app-name';
    appName.textContent = appNames[packageName] || packageName;
    
    const appPackage = document.createElement('div');
    appPackage.className = 'app-package';
    appPackage.textContent = packageName;
    
    appInfo.appendChild(appName);
    appInfo.appendChild(appPackage);
    
    // 创建按钮容器
    const btnContainer = document.createElement('div');
    btnContainer.className = 'app-actions';
    
    // 创建编辑应用名按钮
    const editNameBtn = document.createElement('button');
    editNameBtn.className = 'btn btn-primary btn-icon';
    editNameBtn.innerHTML = '<i class="material-icons-round">drive_file_rename_outline</i>';
    editNameBtn.title = '编辑应用名称';
    editNameBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showEditNameModal(packageName);
    });
    
    // 创建添加规则按钮
    const addRuleBtn = document.createElement('button');
    addRuleBtn.className = 'btn btn-accent btn-icon';
    addRuleBtn.innerHTML = '<i class="material-icons-round">add</i>';
    addRuleBtn.title = '添加规则';
    addRuleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showAddRuleModal(packageName);
    });
    
    // 创建删除按钮
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-danger btn-icon';
    deleteBtn.innerHTML = '<i class="material-icons-round">delete</i>';
    deleteBtn.title = '删除所有规则';
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showDeleteConfirm(packageName);
    });
    
    btnContainer.appendChild(editNameBtn);
    btnContainer.appendChild(addRuleBtn);
    btnContainer.appendChild(deleteBtn);
    
    // 把所有元素添加到应用项
    appItem.appendChild(appInfo);
    appItem.appendChild(btnContainer);
    
    // 创建绑定面板（默认隐藏）
    const bindingPanel = document.createElement('div');
    bindingPanel.className = 'binding-panel';
    
    // 获取该应用的所有绑定
    const appBindingRules = appBindings.filter(binding => binding.packageName === packageName);
    
    // 添加绑定项
    for (const binding of appBindingRules) {
        const bindingItem = createBindingItem(binding);
        bindingPanel.appendChild(bindingItem);
    }
    
    // 添加到容器
    container.appendChild(appItem);
    container.appendChild(bindingPanel);
    
    // 绑定点击事件，展开/折叠绑定面板
    appItem.addEventListener('click', () => {
        const allPanels = document.querySelectorAll('.binding-panel');
        const allAppItems = document.querySelectorAll('.app-item');
        
        allPanels.forEach(panel => {
            if (panel !== bindingPanel) {
                panel.classList.remove('active');
            }
        });
        
        allAppItems.forEach(item => {
            if (item !== appItem) {
                item.classList.remove('active');
            }
        });
        
        bindingPanel.classList.toggle('active');
        appItem.classList.toggle('active');
        
        // 确保卡片容器保持其样式
        const cards = document.querySelectorAll('.card');
        cards.forEach(card => {
            if (card.contains(appItem)) {
                // 添加类以增强卡片顶部的样式
                if (bindingPanel.classList.contains('active')) {
                    card.classList.add('has-active-item');
                }
            }
        });
        
        activeApp = bindingPanel.classList.contains('active') ? packageName : null;
    });
}

// 创建绑定项
function createBindingItem(binding) {
    const bindingItem = document.createElement('div');
    bindingItem.className = 'binding-item';
    bindingItem.dataset.id = binding.id;
    
    // 创建绑定标识符文本
    const bindingTarget = document.createElement('div');
    bindingTarget.className = 'binding-target';
    let targetText = binding.packageName;
    
    if (binding.processName) {
        targetText += binding.processName;
    } else if (binding.threadName) {
        targetText += `{${binding.threadName}}`;
    }
    
    bindingTarget.textContent = targetText;
    
    // 创建绑定类型标识
    const bindingTypeTag = document.createElement('div');
    bindingTypeTag.className = 'binding-type-tag';
    
    let typeText = '主进程';
    let typeIcon = 'smartphone';
    let typeClass = 'type-main';
    
    if (binding.processName) {
        typeText = '子进程';
        typeIcon = 'layers';
        typeClass = 'type-process';
    } else if (binding.threadName) {
        typeText = '线程';
        typeIcon = 'loop';
        typeClass = 'type-thread';
    }
    
    bindingTypeTag.innerHTML = `<i class="material-icons-round">${typeIcon}</i><span>${typeText}</span>`;
    bindingTypeTag.classList.add(typeClass);
    
    // 创建核心输入
    const coresInput = document.createElement('input');
    coresInput.type = 'text';
    coresInput.className = 'binding-cores';
    coresInput.value = binding.cores;
    coresInput.placeholder = '例如: 0-3,5-7';
    coresInput.dataset.id = binding.id;
    coresInput.addEventListener('change', function() {
        updateBindingCores(binding.id, this.value);
    });

    // 创建操作按钮容器
    const actionContainer = document.createElement('div');
    actionContainer.className = 'binding-item-actions';

    // 创建编辑按钮
    const editBindingBtn = document.createElement('button');
    editBindingBtn.className = 'btn btn-primary btn-icon btn-small';
    editBindingBtn.innerHTML = '<i class="material-icons-round">edit</i>';
    editBindingBtn.title = '编辑规则';
    editBindingBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        showEditBindingModal(binding.id);
    });
    
    // 创建删除按钮
    const deleteBindingBtn = document.createElement('button');
    deleteBindingBtn.className = 'btn btn-danger btn-icon btn-small';
    deleteBindingBtn.innerHTML = '<i class="material-icons-round">delete</i>';
    deleteBindingBtn.title = '删除规则';
    deleteBindingBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        deleteBinding(binding.id);
    });
    
    // 添加按钮到操作容器
    actionContainer.appendChild(editBindingBtn);
    actionContainer.appendChild(deleteBindingBtn);
    
    // 组装绑定项
    bindingItem.appendChild(bindingTarget);
    bindingItem.appendChild(bindingTypeTag);
    bindingItem.appendChild(coresInput);
    bindingItem.appendChild(actionContainer);
    
    return bindingItem;
}

// 生成唯一ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// 更新绑定核心
function updateBindingCores(id, cores) {
    if (!validateCoreInput(cores)) {
        showToast('核心输入格式不正确，请使用形如 0-3 或 0,1,2,3 的格式', 'error');
        return;
    }
        
    const binding = appBindings.find(b => b.id === id);
    if (binding) {
        binding.cores = cores;
        saveConfig();
    }
}

// 删除绑定
function deleteBinding(id) {
    const index = appBindings.findIndex(b => b.id === id);
    if (index !== -1) {
        const packageName = appBindings[index].packageName;
        appBindings.splice(index, 1);
        
        // 检查该应用是否还有其他绑定
        const remainingBindings = appBindings.filter(b => b.packageName === packageName);
        
        if (remainingBindings.length === 0) {
            // 如果没有剩余绑定，更新整个UI
            updateBindingsList();
        } else {
            // 更新该应用的绑定面板
            const bindingPanel = document.querySelector(`.app-item[data-package="${packageName}"]`).nextElementSibling;
            bindingPanel.innerHTML = '';
            
            for (const binding of remainingBindings) {
                const bindingItem = createBindingItem(binding);
                bindingPanel.appendChild(bindingItem);
            }
        }
        
        saveConfig();
        showToast('规则已删除', 'success');
    }
}

// 显示添加应用模态框
function showAddAppModal() {
    console.log('显示添加应用模态框');
    
    // 检查模态框元素是否存在
    const modal = document.getElementById('add-app-modal');
    if (!modal) {
        console.error('添加应用模态框元素不存在');
        return;
    }
    
    // 清空输入
    const nameInput = document.getElementById('new-app-name');
    const packageInput = document.getElementById('new-app-package');
    
    if (nameInput) nameInput.value = '';
    if (packageInput) packageInput.value = '';
    
    // 初始化进程/线程列表
    initProcessList();
    
    // 显示模态框
    modal.classList.add('active');
    console.log('模态框已激活');
}

// 在添加应用模态框中添加导入配置按钮
function addImportButtonToModal() {
    // 获取"添加进程/线程"按钮
    const addProcessButtonContainer = document.getElementById('add-process-btn')?.parentElement;
    if (!addProcessButtonContainer) {
        console.error('未找到添加进程按钮的容器');
        return;
    }
    
}

// 隐藏添加应用模态框
function hideAddAppModal() {
    document.getElementById('add-app-modal').classList.remove('active');
}

// 显示添加规则模态框
function showAddRuleModal(packageName) {
    // 预填包名
    document.getElementById('new-app-package').value = packageName;
    // 预填应用名(如果有)
    document.getElementById('new-app-name').value = appNames[packageName] || '';
    
    // 初始化进程/线程列表
    initProcessList();
    
    // 显示模态框
    document.getElementById('add-app-modal').classList.add('active');
}

// 显示编辑应用名模态框
function showEditNameModal(packageName) {
    // 设置当前编辑的包名
    currentEditPackage = packageName;
    
    // 填充表单
    document.getElementById('edit-app-name').value = appNames[packageName] || '';
    document.getElementById('edit-package').value = packageName;
    
    // 显示模态框
    document.getElementById('edit-name-modal').classList.add('active');
}

// 隐藏编辑应用名模态框
function hideEditNameModal() {
    document.getElementById('edit-name-modal').classList.remove('active');
    currentEditPackage = '';
}

// 保存应用名称
function saveAppName() {
    const appName = document.getElementById('edit-app-name').value.trim();
    const newPackageName = document.getElementById('edit-package').value.trim();
    
    if (currentEditPackage) {
        // 验证新包名
        if (!newPackageName) {
            showToast('请输入包名', 'error');
            return;
        }
        
        // 检查包名是否已存在
        if (newPackageName !== currentEditPackage && appBindings.some(b => b.packageName === newPackageName)) {
            showToast('该包名已存在', 'error');
            return;
        }
        
        // 如果包名改变了
        if (newPackageName !== currentEditPackage) {
            // 更新所有相关绑定的包名
            appBindings.forEach(binding => {
                if (binding.packageName === currentEditPackage) {
                    binding.packageName = newPackageName;
                }
            });
            
            // 更新应用名映射
            if (appNames[currentEditPackage]) {
                appNames[newPackageName] = appNames[currentEditPackage];
            }
            
            // 更新当前编辑的包名
            currentEditPackage = newPackageName;
        }
        
        // 处理应用名
        if (appName) {
            // 保存应用名
            appNames[newPackageName] = appName;
            
            // 更新UI中显示的应用名
            const appNameElement = document.querySelector(`.app-item[data-package="${newPackageName}"] .app-name`);
            if (appNameElement) {
                appNameElement.textContent = appName;
            }
        } else {
            // 如果为空，删除应用名
            delete appNames[newPackageName];
            
            // 更新UI中显示的应用名（使用包名替代）
            const appNameElement = document.querySelector(`.app-item[data-package="${newPackageName}"] .app-name`);
            if (appNameElement) {
                appNameElement.textContent = newPackageName;
            }
        }
        
        // 更新UI
        updateBindingsList();
        
        // 保存配置
        saveConfig();
        
        showToast('应用信息已保存', 'success');
    }
    
    // 隐藏模态框
    hideEditNameModal();
}

// 添加新应用
function addNewApp() {
    const appName = document.getElementById('new-app-name').value.trim();
    const packageName = document.getElementById('new-app-package').value.trim();
    
    // 验证必填字段
    // 应用名不再是必填项
    
    if (!packageName) {
        showToast('请输入包名', 'error');
        return;
    }
    
    // 获取所有进程/线程输入
    const processItems = document.querySelectorAll('.process-item');
    const bindingTypes = Array.from(processItems).map(item => item.querySelector('.binding-type').value);
    const processInputs = Array.from(processItems).map(item => item.querySelector('.process-input'));
    const processCores = Array.from(processItems).map(item => item.querySelector('.process-cores'));
    
    let hasAtLeastOneProcess = false;
    const newBindings = [];
    
    // 遍历所有进程/线程输入
    for (let i = 0; i < processInputs.length; i++) {
        const bindingType = bindingTypes[i];
        const processThread = processInputs[i].value.trim();
        const processCoreSetting = processCores[i].value.trim();
        
        // 验证必填项
        if (!processCoreSetting) {
            showToast('请设置CPU核心绑定', 'error');
            return;
        }
        
        // 验证每个单独的核心输入
        if (!validateCoreInput(processCoreSetting)) {
            showToast('核心输入格式不正确，请使用形如 0-3 或 0,1,2,3 的格式', 'error');
            return;
        }
        
        // 根据规则类型处理
            let processName = '';
            let threadName = '';
            
        if (bindingType === 'main') {
            // 主进程规则
            processName = '';
            threadName = '';
        } else if (bindingType === 'process') {
            // 子进程规则
            if (!processThread) {
                showToast('请输入进程名', 'error');
                return;
            }
            processName = ':' + processThread;
        } else if (bindingType === 'thread') {
            // 线程规则
            if (!processThread) {
                showToast('请输入线程名', 'error');
                return;
            }
                threadName = processThread;
            }
            
            const newBinding = {
                id: generateId(),
                packageName: packageName,
                processName: processName,
                threadName: threadName,
                cores: processCoreSetting,
                comment: ''
            };
            
            newBindings.push(newBinding);
            hasAtLeastOneProcess = true;
    }
    
    if (!hasAtLeastOneProcess) {
        showToast('请至少添加一个进程或线程，并设置其CPU核心绑定', 'error');
        return;
    }
    
    // 保存应用名称
    if (appName) {
        appNames[packageName] = appName;
    }
    
    // 将新的绑定添加到全局绑定数组
    appBindings = appBindings.concat(newBindings);
    
    // 更新UI
    updateBindingsList();
    
    // 保存配置
    saveConfig();
    
    // 隐藏模态框
    hideAddAppModal();
    
    showToast('应用绑定已添加', 'success');
}

// 显示删除确认对话框
function showDeleteConfirm(packageName) {
    document.getElementById('confirm-title').textContent = '确认删除';
    document.getElementById('confirm-message').textContent = `确定要删除应用 ${appNames[packageName] || packageName} 的所有绑定规则吗？`;
    
    const confirmDialog = document.getElementById('custom-confirm');
    confirmDialog.classList.add('active');
    
    const confirmYesBtn = document.getElementById('confirm-yes');
    const confirmNoBtn = document.getElementById('confirm-no');
    
    const newYesBtn = confirmYesBtn.cloneNode(true);
    const newNoBtn = confirmNoBtn.cloneNode(true);
    
    confirmYesBtn.parentNode.replaceChild(newYesBtn, confirmYesBtn);
    confirmNoBtn.parentNode.replaceChild(newNoBtn, confirmNoBtn);
    
    newYesBtn.addEventListener('click', function() {
        hideConfirmDialog();
        deleteAppBindings(packageName);
    });
    
    newNoBtn.addEventListener('click', function() {
        hideConfirmDialog();
    });
}

// 删除应用的所有绑定
function deleteAppBindings(packageName) {
    const appNameToShow = appNames[packageName] || packageName;
    
    // 删除绑定
    appBindings = appBindings.filter(binding => binding.packageName !== packageName);
    
    // 更新UI
    updateBindingsList();
    
    // 保存配置
    saveConfig();
    
    showToast(`已删除应用 ${appNameToShow} 的所有绑定规则`, 'success');
}

// 生成配置文件内容
function generateConfigContent() {
    let content = `# Android CPU亲和性设置配置文件
# ===================================#===
# 支持的绑定格式:
# 1. 主进程绑定: packageName=CPU核心范围
#    示例: com.example.app=0-3
#
# 2. 子进程绑定: packageName:processName=CPU核心范围
#    示例: com.example.app:push=0-1
#
# 3. 线程绑定: packageName{threadName}=CPU核心范围
#    示例: com.example.app{RenderThread}=2-4
#
# CPU核心范围格式:
# - 单个核心: 0
# - 连续范围: 0-3
# - 多个范围: 0-1,5-7
# ===================================#===

`;

    // 按包名对绑定进行分组
    const bindingsByPackage = {};
    
    for (const binding of appBindings) {
        if (!bindingsByPackage[binding.packageName]) {
            bindingsByPackage[binding.packageName] = [];
        }
        bindingsByPackage[binding.packageName].push(binding);
    }
    
    // 为每个应用生成配置
    for (const packageName in bindingsByPackage) {
        const appBindingRules = bindingsByPackage[packageName];
        
        // 添加应用名称作为注释
        if (appNames[packageName]) {
            content += `\n# ${appNames[packageName]}\n`;
        } else {
            content += `\n`;
        }
        
        // 添加绑定规则
        for (const binding of appBindingRules) {
            let target = binding.packageName;
            
            if (binding.processName) {
                target += binding.processName;
            } else if (binding.threadName) {
                target += `{${binding.threadName}}`;
            }
            
            content += `${target}=${binding.cores}\n`;
        }
    }
    
    return content;
}

// 保存配置
async function saveConfig() {
    if (actionRunning) {
        showToast('操作正在进行中，请稍后再试', 'info');
        return;
    }
    
    actionRunning = true;
    showLoading();
        
    try {
        // 生成配置内容
        const configContent = generateConfigContent();
        
        // 使用try/catch包装，确保编码错误不会导致整个操作失败
        try {
        // 使用base64编码避免转义问题
        const base64Content = btoa(unescape(encodeURIComponent(configContent)));
        await execCommand(`echo "${base64Content}" | base64 -d > ${CONFIG_FILE_PATH}`);
        } catch (encodeError) {
            console.error("编码配置失败，尝试直接写入:", encodeError);
            // 备选方案：尝试直接写入
            await execCommand(`cat > ${CONFIG_FILE_PATH} << 'EOT'\n${configContent}\nEOT`);
        }
        
        showToast('配置已保存', 'success');
    } catch (error) {
        console.error('保存配置失败:', error);
        showToast('保存配置失败，请检查权限', 'error');
    } finally {
        hideLoading();
        actionRunning = false;
    }
}

// 执行shell命令
async function execCommand(command) {
    const callbackName = `exec_callback_${Date.now()}`;
    return new Promise((resolve, reject) => {
        window[callbackName] = (errno, stdout, stderr) => {
            delete window[callbackName];
            errno === 0 ? resolve(stdout) : reject(stderr);
        };
        
        try {
            if (ksuApi && ksuApi.exec) {
                ksuApi.exec(command, "{}", callbackName);
            } else if (typeof ksu !== 'undefined' && ksu.exec) {
                // 兼容性处理，尝试直接使用ksu对象
        ksu.exec(command, "{}", callbackName);
            } else {
                // 完全无法访问API时
                console.error("KernelSU API不可用");
                showToast("KernelSU API不可用，请检查权限或刷新页面", "error");
                reject("KernelSU API不可用");
            }
        } catch (error) {
            console.error("执行命令失败:", error);
            showToast("执行命令失败: " + error.message, "error");
            reject(error);
        }
    });
}

// 显示加载动画
function showLoading() {
    document.querySelector('.loading-overlay').style.display = 'flex';
}

// 隐藏加载动画
function hideLoading() {
    document.querySelector('.loading-overlay').style.display = 'none';
}

// 显示提示信息
function showToast(message, type = 'info') {
    const toastContainer = document.querySelector('.toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // 添加图标
    let iconName = '';
    switch (type) {
        case 'success':
            iconName = 'check_circle';
            break;
        case 'error':
            iconName = 'error';
            break;
        case 'info':
            iconName = 'info';
            break;
    }
    
    toast.innerHTML = `<i class="material-icons-round">${iconName}</i>${message}`;
    toastContainer.appendChild(toast);
    
    // 自动移除
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}
    
// 应用涟漪效果
function applyRippleEffect() {
    const buttons = document.querySelectorAll('.btn');
    
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const rect = button.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const ripple = document.createElement('span');
            ripple.style.position = 'absolute';
            ripple.style.width = '1px';
            ripple.style.height = '1px';
            ripple.style.borderRadius = '50%';
            ripple.style.transform = 'scale(0)';
            ripple.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.style.animation = 'ripple-effect 0.6s ease-out';
            
            button.style.position = 'relative';
            button.style.overflow = 'hidden';
            button.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
    
    // 添加动画
    if (!document.getElementById('ripple-animation')) {
        const style = document.createElement('style');
        style.id = 'ripple-animation';
        style.textContent = `
            @keyframes ripple-effect {
                to {
                    transform: scale(50);
                    opacity: 0;
                }
            }
            
            .fade-out {
                opacity: 0;
                transition: opacity 0.3s ease;
            }
        `;
        document.head.appendChild(style);
    }
}

// 搜索应用
function searchApps() {
    const searchText = document.getElementById('search-input').value.trim();
    if (!searchText) {
        updateBindingsList();
        return;
    }
    
    // 先更新列表
    updateBindingsList(searchText);
    
    // 然后检查是否有匹配的进程或线程名
    if (searchText.length >= 2) {  // 搜索文本至少2个字符才进行自动定位
        // 查找匹配的绑定项
        const matchedBindings = appBindings.filter(binding => 
            (binding.threadName && binding.threadName.toLowerCase().includes(searchText.toLowerCase())) ||
            (binding.processName && binding.processName.toLowerCase().includes(searchText.toLowerCase()))
        );
        
        if (matchedBindings.length > 0) {
            // 获取第一个匹配项
            const firstMatch = matchedBindings[0];
            
            // 稍微延迟执行，确保UI已完全更新
            setTimeout(() => {
                // 查找并点击对应的应用项
                const appItem = document.querySelector(`.app-item[data-package="${firstMatch.packageName}"]`);
                if (appItem) {
                    // 触发点击事件以展开应用面板
                    appItem.click();
                    
                    // 滚动到可视区域
                    appItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    
                    // 查找并高亮匹配的绑定项
                    setTimeout(() => {
                        const bindingItem = document.querySelector(`.binding-item[data-id="${firstMatch.id}"]`);
                        if (bindingItem) {
                            // 添加临时高亮效果
                            bindingItem.classList.add('highlight-item');
                            
                            // 滚动到绑定项
                            bindingItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            
                            // 移除高亮效果
                            setTimeout(() => {
                                bindingItem.classList.remove('highlight-item');
                            }, 2000);
                        }
                    }, 300);
                }
            }, 100);
        }
    }
}

// 初始化进程/线程列表
function initProcessList() {
    console.log('初始化进程/线程列表');
    
    const processList = document.getElementById('process-list');
    if (!processList) {
        console.error('未找到process-list元素');
        return;
    }
    
    processList.innerHTML = '';
    
    // 添加一个空的进程输入项
    const processItem = document.createElement('div');
    processItem.className = 'process-item';
    // 使用CSS类代替内联样式进行布局
    processItem.innerHTML = `
        <div class="process-input-container">
            <div class="binding-type-wrapper">
                <select class="form-control binding-type">
                    <option value="main">主进程</option>
                    <option value="process">子进程</option>
                    <option value="thread">线程</option>
                </select>
            </div>
            <div class="process-input-wrapper">
                <input type="text" class="form-control process-input" placeholder="例如: RenderThread 或 :push">
            </div>
            <div class="cores-input-wrapper">
                <input type="text" class="form-control process-cores" placeholder="核心绑定: 0-3,5-7">
            </div>
            <button type="button" class="btn btn-danger btn-icon remove-process"><i class="material-icons-round">close</i></button>
        </div>
    `;
    
    processList.appendChild(processItem);
    console.log('已添加进程输入项');

    // 绑定规则类型切换事件
    const bindingTypeSelect = processItem.querySelector('.binding-type');
    const processInput = processItem.querySelector('.process-input');
    // 获取包装器以控制显示/隐藏
    const processInputWrapper = processItem.querySelector('.process-input-wrapper');

    if (bindingTypeSelect && processInput && processInputWrapper) {
        bindingTypeSelect.addEventListener('change', function() {
            const type = this.value;
            if (type === 'main') {
                processInput.value = '';
                processInputWrapper.style.display = 'none'; // 隐藏输入框包装器
            } else {
                processInputWrapper.style.display = 'block'; // 显示输入框包装器
                processInput.placeholder = type === 'process' ? '例如: push' : '例如: RenderThread';
            }
        });

        // 初始化时触发一次选择事件
        bindingTypeSelect.dispatchEvent(new Event('change'));
    } else {
        console.error('未找到binding类型下拉框或进程输入框元素');
    }
    
    // 初始化删除按钮事件
    const removeBtn = processItem.querySelector('.remove-process');
    if (removeBtn) {
        removeBtn.addEventListener('click', function() {
        if (processList.querySelectorAll('.process-item').length > 1) {
            processItem.remove();
        } else {
            // 如果只有一个输入项，则清空它而不是删除
                if (processInput) processInput.value = '';
                const coresInput = processItem.querySelector('.process-cores');
                if (coresInput) coresInput.value = '';
                if (bindingTypeSelect) {
                    bindingTypeSelect.value = 'main';
                    bindingTypeSelect.dispatchEvent(new Event('change'));
                }
            }
        });
    } else {
        console.error('未找到remove-process按钮元素');
    }
}

// 添加新的进程/线程输入项
function addProcessItem() {
    const processList = document.getElementById('process-list');
    
    // 创建新的进程输入项
    const processItem = document.createElement('div');
    processItem.className = 'process-item';
    // 使用CSS类代替内联样式进行布局
    processItem.innerHTML = `
        <div class="process-input-container">
            <div class="binding-type-wrapper">
                <select class="form-control binding-type">
                    <option value="main">主进程</option>
                    <option value="process">子进程</option>
                    <option value="thread">线程</option>
                </select>
            </div>
            <div class="process-input-wrapper">
                <input type="text" class="form-control process-input" placeholder="例如: RenderThread 或 :push">
            </div>
            <div class="cores-input-wrapper">
                <input type="text" class="form-control process-cores" placeholder="核心绑定: 0-3,5-7">
            </div>
            <button type="button" class="btn btn-danger btn-icon remove-process"><i class="material-icons-round">close</i></button>
        </div>
    `;
    
    processList.appendChild(processItem);
    
    // 绑定规则类型切换事件
    const bindingTypeSelect = processItem.querySelector('.binding-type');
    const processInput = processItem.querySelector('.process-input');
    // 获取包装器以控制显示/隐藏
    const processInputWrapper = processItem.querySelector('.process-input-wrapper'); 
    
    bindingTypeSelect.addEventListener('change', function() {
        const type = this.value;
        if (type === 'main') {
            processInput.value = '';
            processInputWrapper.style.display = 'none'; // 隐藏输入框包装器
        } else {
            processInputWrapper.style.display = 'block'; // 显示输入框包装器
            processInput.placeholder = type === 'process' ? '例如: push' : '例如: RenderThread';
        }
    });
    
    // 初始化时触发一次选择事件
    bindingTypeSelect.dispatchEvent(new Event('change'));
    
    // 绑定删除按钮事件
    processItem.querySelector('.remove-process').addEventListener('click', function() {
        processItem.remove();
    });
    
    // 聚焦到新添加的输入框的核心绑定部分（如果可见）
    const coresInput = processItem.querySelector('.process-cores');
    if (coresInput) {
        coresInput.focus();
    }
}

// 切换绑定类型字段的显示/隐藏
function toggleBindingTypeFields() {
    const bindingType = document.getElementById('edit-binding-type').value;
    const processGroup = document.getElementById('edit-binding-process-group');
    const threadGroup = document.getElementById('edit-binding-thread-group');
    
    // 根据选择的类型显示/隐藏相应字段
    if (bindingType === 'process') {
        processGroup.style.display = 'block';
        threadGroup.style.display = 'none';
    } else if (bindingType === 'thread') {
        processGroup.style.display = 'none';
        threadGroup.style.display = 'block';
    } else {
        // 主进程
        processGroup.style.display = 'none';
        threadGroup.style.display = 'none';
    }
}

// 显示编辑绑定模态框
function showEditBindingModal(bindingId) {
    const binding = appBindings.find(b => b.id === bindingId);
    if (!binding) return;
    
    // 填充表单
    document.getElementById('edit-binding-package').value = binding.packageName;
    document.getElementById('edit-binding-cores').value = binding.cores;
    document.getElementById('edit-binding-id').value = bindingId;
    
    // 设置绑定类型
    let bindingType = 'main';
    if (binding.processName) {
        bindingType = 'process';
        document.getElementById('edit-binding-process').value = binding.processName.substring(1); // 去掉前缀':'
    } else if (binding.threadName) {
        bindingType = 'thread';
        document.getElementById('edit-binding-thread').value = binding.threadName;
    }
    
    document.getElementById('edit-binding-type').value = bindingType;
    toggleBindingTypeFields(); // 触发显示/隐藏相应字段
    
    // 显示模态框
    document.getElementById('edit-binding-modal').classList.add('active');
}

// 隐藏编辑绑定模态框
function hideEditBindingModal() {
    document.getElementById('edit-binding-modal').classList.remove('active');
}

// 保存绑定修改
function saveBindingChanges() {
    const bindingId = document.getElementById('edit-binding-id').value;
    const packageName = document.getElementById('edit-binding-package').value.trim();
    const cores = document.getElementById('edit-binding-cores').value.trim();
    const bindingType = document.getElementById('edit-binding-type').value;
    
    // 验证必填字段
    if (!packageName) {
        showToast('请输入包名', 'error');
        return;
    }
    
    if (!cores) {
        showToast('请输入CPU核心', 'error');
        return;
    }
    
    if (!validateCoreInput(cores)) {
        showToast('核心输入格式不正确，请使用形如 0-3 或 0,1,2,3 的格式', 'error');
        return;
    }
    
    // 获取进程/线程值
    let processName = '';
    let threadName = '';
    
    if (bindingType === 'process') {
        const processValue = document.getElementById('edit-binding-process').value.trim();
        if (!processValue) {
            showToast('请输入进程名', 'error');
            return;
        }
        processName = ':' + processValue;
    } else if (bindingType === 'thread') {
        const threadValue = document.getElementById('edit-binding-thread').value.trim();
        if (!threadValue) {
            showToast('请输入线程名', 'error');
            return;
        }
        threadName = threadValue;
    }
    
    // 更新绑定
    const binding = appBindings.find(b => b.id === bindingId);
    if (binding) {
        // 记住当前包名和目标包名
        const oldPackageName = binding.packageName;
        
        // 更新绑定配置
        binding.packageName = packageName;
        binding.processName = processName;
        binding.threadName = threadName;
        binding.cores = cores;
        
        // 如果包名变了，可能需要更新应用名
        if (oldPackageName !== packageName && appNames[oldPackageName]) {
            // 将应用名与新包名关联
            appNames[packageName] = appNames[oldPackageName];
        }
        
        // 记住当前活跃的应用
        const currentActiveApp = activeApp;
        
        // 更新UI
        updateBindingsList();
        
        // 保存配置
        saveConfig();
        
        // 重新展开应用面板
        if (currentActiveApp) {
            setTimeout(() => {
                // 如果包名变了，展开新的包名对应的应用
                const targetPackage = packageName;
                const appItem = document.querySelector(`.app-item[data-package="${targetPackage}"]`);
                if (appItem) {
                    // 触发点击事件以展开
                    appItem.click();
                    
                    // 滚动到可视区域
                    appItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            }, 100);
        }
        
        showToast('绑定规则已更新', 'success');
    }
    
    // 隐藏模态框
    hideEditBindingModal();
}

// 显示帮助模态框
function showHelpModal() {
    document.getElementById('help-modal').classList.add('active');
    
    // 防止背景滚动（特别是在移动设备上）
    document.body.style.overflow = 'hidden';
    
    // 确保模态框在移动端正确显示
    if (window.innerWidth <= 480) {
        // 滚动到顶部
        setTimeout(() => {
            const modalBody = document.querySelector('#help-modal .modal-body');
            if (modalBody) {
                modalBody.scrollTop = 0;
            }
        }, 50);
    }
}

// 隐藏帮助模态框
function hideHelpModal() {
    const modal = document.getElementById('help-modal');
    if (modal) {
        modal.classList.remove('active');
    document.body.style.overflow = '';
}
}

// 添加导入配置到悬浮菜单
function addImportConfigToFloatingMenu() {
    console.log('尝试添加导入配置到悬浮菜单');
    
    // 监听菜单容器变化
    const observer = new MutationObserver((mutations, obs) => {
        mutations.forEach(mutation => {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                // 检查是否是菜单容器被添加
                const menuContainer = document.querySelector('.menu-list, .dropdown-menu, .floating-menu');
                if (menuContainer && !menuContainer.querySelector('#menu-import-config-btn')) {
                    console.log('菜单容器出现，添加导入配置按钮');
                    
                    // 获取现有的"使用说明"按钮作为参考
                    const helpBtn = Array.from(menuContainer.querySelectorAll('a, button, li')).find(el => {
                        // 通过文本内容判断
                        const text = el.textContent || '';
                        if (text.includes('使用说明') || text.includes('帮助') || text.includes('说明')) {
                            return true;
                        }
                        
                        // 通过属性判断
                        if (el.getAttribute('data-action') === 'help' || 
                            el.getAttribute('onclick')?.includes('help') || 
                            el.getAttribute('href')?.includes('help')) {
                            return true;
                        }
                        
                        // 通过图标判断
                        const icon = el.querySelector('i');
                        if (icon && (icon.className.includes('help') || icon.className.includes('info'))) {
                            return true;
                        }
                        
                        return false;
                    });
                    
                    // 获取"添加"按钮作为参考
                    const addBtn = Array.from(menuContainer.querySelectorAll('a, button, li')).find(el => {
                        // 通过文本内容判断
                        const text = el.textContent || '';
                        if (text.includes('添加应用') || text.includes('添加') || text.includes('新增')) {
                            return true;
                        }
                        
                        // 通过属性判断
                        if (el.getAttribute('data-action') === 'add' || 
                            el.getAttribute('onclick')?.includes('add') || 
                            el.getAttribute('href')?.includes('add')) {
                            return true;
                        }
                        
                        // 通过图标判断
                        const icon = el.querySelector('i');
                        if (icon && (icon.className.includes('add') || icon.className.includes('plus'))) {
                            return true;
                        }
                        
                        return false;
                    });
                    
                    // 使用现有按钮作为模板
                    let templateBtn = helpBtn || addBtn || menuContainer.querySelector('a, button, li');
                    if (templateBtn) {
                        // 创建导入配置按钮
                        const importBtn = templateBtn.cloneNode(true);
                        importBtn.id = 'menu-import-config-btn';
                        importBtn.setAttribute('data-action', 'import');
                        
                        // 清除可能干扰的属性
                        importBtn.removeAttribute('href');
                        
                        // 设置HTML内容
                        if (templateBtn.querySelector('i')) {
                            // 如果有图标，替换图标和文字
                            const icon = importBtn.querySelector('i');
                            if (icon) {
                                // 保留原有的图标样式，但删除特定关键词
                                const className = icon.className.replace(/help|question|info|add|plus/g, '');
                                icon.className = className + ' material-icons-round';
                                icon.textContent = 'file_upload';
                            }
                            
                            const text = importBtn.querySelector('span, div');
                            if (text) {
                                text.textContent = '导入配置';
                            }
                        } else {
                            // 没有图标，直接设置文本
                            importBtn.textContent = '导入配置';
                        }
                        
                        // 添加点击事件
                        importBtn.addEventListener('click', (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('导入配置按钮被点击');
                            showImportConfig();
                        });
                        
                        // 插入到适当位置
                        if (addBtn) {
                            // 添加在"添加应用"之前
                            menuContainer.insertBefore(importBtn, addBtn);
                        } else if (helpBtn) {
                            // 添加在"使用说明"之前
                            menuContainer.insertBefore(importBtn, helpBtn);
                        } else {
                            // 添加到菜单开头
                            menuContainer.insertBefore(importBtn, menuContainer.firstChild);
                        }
                        
                        // 可能需要应用ripple效果
                        if (typeof applyRippleEffect === 'function') {
                            try {
                                applyRippleEffect(importBtn);
                            } catch (e) {
                                console.error('应用涟漪效果失败', e);
                            }
                        }
                        
                        console.log('导入配置按钮已添加');
                    }
                }
            }
        });
    });
    
    // 监视悬浮按钮点击事件
    const floatingBtn = document.querySelector('.float-button, .menu-btn, .floating-btn, .fab-btn, .action-btn');
    if (floatingBtn) {
        console.log('找到悬浮按钮');
        
        // 监听点击事件，点击时可能会显示菜单
        floatingBtn.addEventListener('click', () => {
            console.log('悬浮按钮被点击');
            
            // 等待菜单显示
            setTimeout(() => {
                observer.observe(document.body, { childList: true, subtree: true });
                
                // 2秒后停止观察，避免资源浪费
                setTimeout(() => {
                    observer.disconnect();
                }, 2000);
            }, 100);
        });
        
        // 初始点击一次，触发菜单显示
        setTimeout(() => {
            try {
                floatingBtn.click();
                setTimeout(() => {
                    floatingBtn.click(); // 再次点击关闭菜单
                }, 500);
            } catch (e) {
                console.error('初始化菜单项添加失败', e);
            }
        }, 1000);
    } else {
        console.log('未找到悬浮按钮');
    }
    
}

// 确保添加应用按钮正常工作
function ensureAddAppButtonWorks() {
    console.log('确保添加应用按钮正常工作');
    // 尝试两种可能的按钮选择器
    const possibleBtns = [
        document.getElementById('add-app-btn'),
        document.querySelector('.fab-menu-item.add'),
        document.querySelector('[data-action="add"]'),
        document.querySelector('.fab-btn'),
        document.querySelector('.add-app-btn')
    ];
    
    for (const btn of possibleBtns) {
        if (btn) {
            console.log('找到添加应用按钮，绑定直接事件');
            // 清除现有事件处理程序
            btn.removeEventListener('click', showAddAppModal);
            // 添加新的事件处理程序并包含直接的调用
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('添加应用按钮被点击 - 直接调用');
                
                // 获取模态框元素
                const modal = document.getElementById('add-app-modal');
                if (modal) {
                    // 初始化表单
                    const nameInput = document.getElementById('new-app-name');
                    const packageInput = document.getElementById('new-app-package');
                    if (nameInput) nameInput.value = '';
                    if (packageInput) packageInput.value = '';
                    
                    // 初始化进程列表
                    try {
                        initProcessList();
                    } catch (error) {
                        console.error('初始化进程列表失败:', error);
                    }
                    
                    // 添加导入按钮
                    try {
                        addImportButtonToModal();
                    } catch (error) {
                        console.error('添加导入按钮失败:', error);
                    }
                    
                    // 显示模态框
                    modal.classList.add('active');
                    console.log('模态框已显示');
                } else {
                    console.error('未找到添加应用模态框元素');
                }
            });
            console.log('已绑定添加应用按钮的直接事件');
        }
    }
    
    // 同时确保模态框关闭按钮正常工作
    const closeBtn = document.getElementById('close-add-app-modal');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            const modal = document.getElementById('add-app-modal');
            if (modal) {
                modal.classList.remove('active');
                console.log('模态框已关闭');
            }
        });
    }
}
