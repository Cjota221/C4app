/* C4 App - Gerenciador de Performance */
/* Otimização de carregamento, lazy loading e cache de recursos */

class C4PerformanceManager {
    constructor() {
        this.loadedModules = new Set();
        this.imageCache = new Map();
        this.scriptCache = new Map();
        this.cssCache = new Map();
        this.observers = new Map();
        this.performanceMetrics = {
            loadTime: 0,
            renderTime: 0,
            interactionTime: 0,
            resourcesLoaded: 0,
            cacheHits: 0
        };
        
        this.init();
    }
    
    init() {
        this.measureInitialLoad();
        this.setupLazyLoading();
        this.setupResourceOptimization();
        this.setupCodeSplitting();
        this.setupCaching();
        this.setupPreloading();
        this.monitorPerformance();
    }
    
    // ========================================
    // MEDIÇÃO DE PERFORMANCE
    // ========================================
    
    measureInitialLoad() {
        const startTime = performance.now();
        
        document.addEventListener('DOMContentLoaded', () => {
            this.performanceMetrics.loadTime = performance.now() - startTime;
            this.logPerformance('DOM loaded', this.performanceMetrics.loadTime);
        });
        
        window.addEventListener('load', () => {
            this.performanceMetrics.renderTime = performance.now() - startTime;
            this.logPerformance('Page fully loaded', this.performanceMetrics.renderTime);
            this.optimizeAfterLoad();
        });
    }
    
    optimizeAfterLoad() {
        // Remover recursos não utilizados
        this.removeUnusedResources();
        
        // Precarregar recursos críticos
        this.preloadCriticalResources();
        
        // Configurar service worker se disponível
        this.setupServiceWorker();
        
        // Otimizar imagens
        this.optimizeImages();
    }
    
    // ========================================
    // LAZY LOADING
    // ========================================
    
    setupLazyLoading() {
        // Lazy loading de imagens
        this.setupImageLazyLoading();
        
        // Lazy loading de módulos JavaScript
        this.setupModuleLazyLoading();
        
        // Lazy loading de seções da página
        this.setupSectionLazyLoading();
    }
    
    setupImageLazyLoading() {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    this.loadImage(img);
                    imageObserver.unobserve(img);
                }
            });
        }, {
            rootMargin: '50px 0px',
            threshold: 0.1
        });
        
        // Observar imagens existentes
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
        
        // Observer para novas imagens
        const mutationObserver = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const images = node.querySelectorAll?.('img[data-src]') || 
                                      (node.matches?.('img[data-src]') ? [node] : []);
                        images.forEach(img => imageObserver.observe(img));
                    }
                });
            });
        });
        
        mutationObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        this.observers.set('images', imageObserver);
    }
    
    async loadImage(img) {
        const src = img.dataset.src;
        if (!src) return;
        
        // Verificar cache
        if (this.imageCache.has(src)) {
            img.src = this.imageCache.get(src);
            img.classList.add('c4-loaded');
            this.performanceMetrics.cacheHits++;
            return;
        }
        
        // Mostrar placeholder de loading
        img.classList.add('c4-loading');
        
        try {
            // Precarregar imagem
            const preloadImg = new Image();
            preloadImg.onload = () => {
                img.src = src;
                img.classList.remove('c4-loading');
                img.classList.add('c4-loaded');
                this.imageCache.set(src, src);
                this.performanceMetrics.resourcesLoaded++;
            };
            
            preloadImg.onerror = () => {
                img.classList.remove('c4-loading');
                img.classList.add('c4-error');
                console.warn(`Failed to load image: ${src}`);
            };
            
            preloadImg.src = src;
            
        } catch (error) {
            console.error('Error loading image:', error);
            img.classList.remove('c4-loading');
            img.classList.add('c4-error');
        }
    }
    
    setupModuleLazyLoading() {
        // Lazy loading de módulos por página
        const moduleMap = {
            'dashboard': ['dashboard.js', 'charts.js'],
            'produtos': ['products.js', 'image-upload.js'],
            'vendas': ['sales.js', 'calculator.js'],
            'clientes': ['clients.js'],
            'metas': ['goals.js', 'charts.js'],
            'calculadoras': ['calculator.js', 'pricing.js'],
            'relatorios': ['reports.js', 'charts.js', 'pdf-generator.js'],
            'c4ai': ['ai-assistant.js'],
            'perfil': ['profile.js']
        };
        
        // Carregar módulos baseado na página atual
        const currentPage = this.getCurrentPage();
        if (moduleMap[currentPage]) {
            this.loadModules(moduleMap[currentPage]);
        }
        
        // Precarregar módulos da próxima página provável
        this.preloadNextPageModules();
    }
    
    async loadModules(moduleNames) {
        const loadPromises = moduleNames.map(moduleName => {
            if (this.loadedModules.has(moduleName)) {
                this.performanceMetrics.cacheHits++;
                return Promise.resolve();
            }
            
            return this.loadScript(`js/modules/${moduleName}`)
                .then(() => {
                    this.loadedModules.add(moduleName);
                    this.performanceMetrics.resourcesLoaded++;
                });
        });
        
        try {
            await Promise.all(loadPromises);
            this.logPerformance(`Loaded ${moduleNames.length} modules`, performance.now());
        } catch (error) {
            console.error('Error loading modules:', error);
        }
    }
    
    setupSectionLazyLoading() {
        const sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const section = entry.target;
                    this.loadSectionContent(section);
                    sectionObserver.unobserve(section);
                }
            });
        }, {
            rootMargin: '100px 0px',
            threshold: 0.1
        });
        
        // Observar seções com lazy loading
        document.querySelectorAll('[data-lazy-section]').forEach(section => {
            sectionObserver.observe(section);
        });
        
        this.observers.set('sections', sectionObserver);
    }
    
    async loadSectionContent(section) {
        const contentUrl = section.dataset.lazySection;
        if (!contentUrl) return;
        
        section.classList.add('c4-loading-section');
        
        try {
            const response = await fetch(contentUrl);
            const content = await response.text();
            section.innerHTML = content;
            section.classList.remove('c4-loading-section');
            section.classList.add('c4-loaded-section');
            
            // Processar novo conteúdo
            this.processNewContent(section);
            
        } catch (error) {
            console.error('Error loading section content:', error);
            section.classList.remove('c4-loading-section');
            section.classList.add('c4-error-section');
        }
    }
    
    // ========================================
    // OTIMIZAÇÃO DE RECURSOS
    // ========================================
    
    setupResourceOptimization() {
        // Otimizar carregamento de CSS
        this.optimizeCSSLoading();
        
        // Otimizar carregamento de JavaScript
        this.optimizeJSLoading();
        
        // Otimizar fontes
        this.optimizeFonts();
    }
    
    optimizeCSSLoading() {
        // Carregar CSS crítico inline e não-crítico de forma assíncrona
        const criticalCSS = [
            'assets/css/01-variables.css',
            'assets/css/02-components.css'
        ];
        
        const nonCriticalCSS = [
            'assets/css/03-animations.css',
            'assets/css/04-mobile-layout.css',
            'assets/css/05-accessibility.css'
        ];
        
        // Carregar CSS crítico primeiro
        criticalCSS.forEach(href => {
            this.loadCSS(href, true);
        });
        
        // Carregar CSS não-crítico após load
        window.addEventListener('load', () => {
            nonCriticalCSS.forEach(href => {
                this.loadCSS(href, false);
            });
        });
    }
    
    loadCSS(href, critical = false) {
        if (this.cssCache.has(href)) {
            this.performanceMetrics.cacheHits++;
            return Promise.resolve();
        }
        
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            
            if (!critical) {
                link.media = 'print';
                link.onload = () => {
                    link.media = 'all';
                    this.cssCache.set(href, true);
                    this.performanceMetrics.resourcesLoaded++;
                    resolve();
                };
            } else {
                link.onload = () => {
                    this.cssCache.set(href, true);
                    this.performanceMetrics.resourcesLoaded++;
                    resolve();
                };
            }
            
            link.onerror = reject;
            document.head.appendChild(link);
        });
    }
    
    optimizeJSLoading() {
        // Carregar scripts de forma assíncrona e em ordem
        const scriptOrder = [
            'js/core/config.js',
            'js/core/utils.js',
            'js/core/storage.js',
            'js/components/accessibility.js',
            'js/components/menu-hamburger.js'
        ];
        
        this.loadScriptsInOrder(scriptOrder);
    }
    
    async loadScriptsInOrder(scripts) {
        for (const script of scripts) {
            try {
                await this.loadScript(script);
                this.logPerformance(`Loaded script: ${script}`, performance.now());
            } catch (error) {
                console.error(`Failed to load script: ${script}`, error);
            }
        }
    }
    
    loadScript(src) {
        if (this.scriptCache.has(src)) {
            this.performanceMetrics.cacheHits++;
            return Promise.resolve();
        }
        
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            
            script.onload = () => {
                this.scriptCache.set(src, true);
                this.performanceMetrics.resourcesLoaded++;
                resolve();
            };
            
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    optimizeFonts() {
        // Precarregar fontes críticas
        const criticalFonts = [
            'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap',
            'https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600&display=swap'
        ];
        
        criticalFonts.forEach(href => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'style';
            link.href = href;
            link.onload = () => {
                link.rel = 'stylesheet';
            };
            document.head.appendChild(link);
        });
    }
    
    // ========================================
    // CODE SPLITTING E CACHING
    // ========================================
    
    setupCodeSplitting() {
        // Dividir código por funcionalidade
        this.createModuleLoader();
        
        // Implementar cache inteligente
        this.setupIntelligentCaching();
    }
    
    createModuleLoader() {
        window.C4ModuleLoader = {
            load: async (moduleName) => {
                if (this.loadedModules.has(moduleName)) {
                    return Promise.resolve();
                }
                
                const startTime = performance.now();
                await this.loadScript(`js/modules/${moduleName}.js`);
                const loadTime = performance.now() - startTime;
                
                this.loadedModules.add(moduleName);
                this.logPerformance(`Module ${moduleName} loaded`, loadTime);
                
                return Promise.resolve();
            },
            
            preload: (moduleNames) => {
                moduleNames.forEach(moduleName => {
                    if (!this.loadedModules.has(moduleName)) {
                        this.preloadScript(`js/modules/${moduleName}.js`);
                    }
                });
            }
        };
    }
    
    preloadScript(src) {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = src;
        document.head.appendChild(link);
    }
    
    setupIntelligentCaching() {
        // Cache baseado em uso
        this.usageCache = new Map();
        
        // Rastrear uso de recursos
        this.trackResourceUsage();
        
        // Limpar cache periodicamente
        setInterval(() => {
            this.cleanupCache();
        }, 300000); // 5 minutos
    }
    
    trackResourceUsage() {
        // Rastrear cliques em navegação
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href]');
            if (link) {
                const href = link.getAttribute('href');
                this.incrementUsage(href);
            }
        });
        
        // Rastrear mudanças de página
        window.addEventListener('popstate', () => {
            const currentPage = this.getCurrentPage();
            this.incrementUsage(currentPage);
        });
    }
    
    incrementUsage(resource) {
        const count = this.usageCache.get(resource) || 0;
        this.usageCache.set(resource, count + 1);
    }
    
    cleanupCache() {
        // Remover recursos pouco usados do cache
        const threshold = 2;
        
        for (const [resource, count] of this.usageCache.entries()) {
            if (count < threshold) {
                this.imageCache.delete(resource);
                this.scriptCache.delete(resource);
                this.cssCache.delete(resource);
            }
        }
        
        this.logPerformance('Cache cleaned up', performance.now());
    }
    
    // ========================================
    // PRELOADING E PREFETCHING
    // ========================================
    
    setupPreloading() {
        // Precarregar recursos baseado em comportamento do usuário
        this.setupPredictivePreloading();
        
        // Precarregar recursos críticos
        this.preloadCriticalResources();
    }
    
    setupPredictivePreloading() {
        let hoverTimer;
        
        // Precarregar ao hover em links
        document.addEventListener('mouseenter', (e) => {
            const link = e.target.closest('a[href]');
            if (link) {
                hoverTimer = setTimeout(() => {
                    this.preloadPage(link.getAttribute('href'));
                }, 200);
            }
        }, true);
        
        document.addEventListener('mouseleave', (e) => {
            const link = e.target.closest('a[href]');
            if (link && hoverTimer) {
                clearTimeout(hoverTimer);
            }
        }, true);
        
        // Precarregar baseado em scroll
        this.setupScrollBasedPreloading();
    }
    
    setupScrollBasedPreloading() {
        let scrollTimer;
        
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(() => {
                this.preloadBasedOnScroll();
            }, 150);
        }, { passive: true });
    }
    
    preloadBasedOnScroll() {
        const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
        
        // Se usuário scrollou mais de 70%, precarregar próxima página provável
        if (scrollPercent > 70) {
            this.preloadNextPageModules();
        }
    }
    
    preloadPage(href) {
        if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;
        
        // Precarregar HTML
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = href;
        document.head.appendChild(link);
        
        // Precarregar recursos da página
        const pageName = href.replace('.html', '').split('/').pop();
        this.preloadPageResources(pageName);
    }
    
    preloadPageResources(pageName) {
        const resourceMap = {
            'produtos': ['js/modules/products.js', 'js/components/image-upload.js'],
            'vendas': ['js/modules/sales.js', 'js/components/calculator.js'],
            'relatorios': ['js/modules/reports.js', 'js/components/charts.js']
        };
        
        const resources = resourceMap[pageName];
        if (resources) {
            resources.forEach(resource => {
                this.preloadScript(resource);
            });
        }
    }
    
    preloadCriticalResources() {
        // Precarregar imagens críticas
        const criticalImages = [
            'assets/img/logo.svg',
            'assets/img/icons/dashboard.svg',
            'assets/img/icons/products.svg'
        ];
        
        criticalImages.forEach(src => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = src;
            document.head.appendChild(link);
        });
    }
    
    preloadNextPageModules() {
        const currentPage = this.getCurrentPage();
        const nextPageMap = {
            'dashboard': ['produtos', 'vendas'],
            'produtos': ['vendas', 'calculadoras'],
            'vendas': ['clientes', 'relatorios'],
            'clientes': ['metas', 'vendas'],
            'metas': ['relatorios', 'dashboard']
        };
        
        const nextPages = nextPageMap[currentPage];
        if (nextPages && window.C4ModuleLoader) {
            nextPages.forEach(page => {
                window.C4ModuleLoader.preload([page]);
            });
        }
    }
    
    // ========================================
    // SERVICE WORKER
    // ========================================
    
    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('Service Worker registered:', registration);
                    this.logPerformance('Service Worker registered', performance.now());
                })
                .catch(error => {
                    console.error('Service Worker registration failed:', error);
                });
        }
    }
    
    // ========================================
    // OTIMIZAÇÃO DE IMAGENS
    // ========================================
    
    optimizeImages() {
        // Converter imagens para WebP quando suportado
        this.setupWebPSupport();
        
        // Implementar responsive images
        this.setupResponsiveImages();
        
        // Comprimir imagens dinamicamente
        this.setupImageCompression();
    }
    
    setupWebPSupport() {
        const supportsWebP = this.checkWebPSupport();
        
        if (supportsWebP) {
            document.querySelectorAll('img[data-webp]').forEach(img => {
                img.src = img.dataset.webp;
            });
        }
    }
    
    checkWebPSupport() {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }
    
    setupResponsiveImages() {
        const images = document.querySelectorAll('img[data-sizes]');
        
        images.forEach(img => {
            const sizes = JSON.parse(img.dataset.sizes);
            const currentWidth = img.offsetWidth;
            
            // Encontrar tamanho mais apropriado
            const appropriateSize = this.findAppropriateImageSize(sizes, currentWidth);
            if (appropriateSize && img.src !== appropriateSize) {
                img.src = appropriateSize;
            }
        });
    }
    
    findAppropriateImageSize(sizes, targetWidth) {
        const sortedSizes = Object.keys(sizes)
            .map(Number)
            .sort((a, b) => a - b);
        
        for (const size of sortedSizes) {
            if (size >= targetWidth) {
                return sizes[size];
            }
        }
        
        return sizes[sortedSizes[sortedSizes.length - 1]];
    }
    
    // ========================================
    // MONITORAMENTO E LIMPEZA
    // ========================================
    
    monitorPerformance() {
        // Monitorar métricas de performance
        this.setupPerformanceObserver();
        
        // Reportar métricas periodicamente
        setInterval(() => {
            this.reportMetrics();
        }, 30000); // 30 segundos
    }
    
    setupPerformanceObserver() {
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                list.getEntries().forEach(entry => {
                    if (entry.entryType === 'navigation') {
                        this.performanceMetrics.loadTime = entry.loadEventEnd - entry.loadEventStart;
                    }
                });
            });
            
            observer.observe({ entryTypes: ['navigation', 'resource'] });
        }
    }
    
    reportMetrics() {
        const metrics = {
            ...this.performanceMetrics,
            memoryUsage: this.getMemoryUsage(),
            cacheSize: this.getCacheSize(),
            timestamp: Date.now()
        };
        
        // Enviar métricas para analytics (se configurado)
        if (window.C4Analytics) {
            window.C4Analytics.track('performance_metrics', metrics);
        }
        
        this.logPerformance('Performance metrics', metrics);
    }
    
    getMemoryUsage() {
        if ('memory' in performance) {
            return {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            };
        }
        return null;
    }
    
    getCacheSize() {
        return {
            images: this.imageCache.size,
            scripts: this.scriptCache.size,
            css: this.cssCache.size,
            modules: this.loadedModules.size
        };
    }
    
    removeUnusedResources() {
        // Remover CSS não utilizado
        this.removeUnusedCSS();
        
        // Remover event listeners órfãos
        this.cleanupEventListeners();
        
        // Limpar observers não utilizados
        this.cleanupObservers();
    }
    
    removeUnusedCSS() {
        // Implementação básica - pode ser expandida
        const unusedSelectors = [];
        
        document.querySelectorAll('style, link[rel="stylesheet"]').forEach(styleSheet => {
            try {
                if (styleSheet.sheet) {
                    const rules = Array.from(styleSheet.sheet.cssRules);
                    rules.forEach(rule => {
                        if (rule.selectorText && !document.querySelector(rule.selectorText)) {
                            unusedSelectors.push(rule.selectorText);
                        }
                    });
                }
            } catch (e) {
                // Ignorar erros de CORS
            }
        });
        
        if (unusedSelectors.length > 0) {
            this.logPerformance(`Found ${unusedSelectors.length} unused CSS selectors`);
        }
    }
    
    cleanupEventListeners() {
        // Implementar limpeza de event listeners órfãos
        // Esta é uma implementação básica
        const elements = document.querySelectorAll('*');
        elements.forEach(element => {
            if (element._eventListeners && element._eventListeners.length === 0) {
                delete element._eventListeners;
            }
        });
    }
    
    cleanupObservers() {
        // Desconectar observers não utilizados
        this.observers.forEach((observer, key) => {
            if (key.startsWith('unused_')) {
                observer.disconnect();
                this.observers.delete(key);
            }
        });
    }
    
    // ========================================
    // UTILITÁRIOS
    // ========================================
    
    getCurrentPage() {
        const path = window.location.pathname;
        return path.split('/').pop().replace('.html', '') || 'dashboard';
    }
    
    processNewContent(container) {
        // Processar imagens lazy load
        const images = container.querySelectorAll('img[data-src]');
        images.forEach(img => {
            this.observers.get('images')?.observe(img);
        });
        
        // Processar seções lazy load
        const sections = container.querySelectorAll('[data-lazy-section]');
        sections.forEach(section => {
            this.observers.get('sections')?.observe(section);
        });
        
        // Aplicar otimizações de acessibilidade
        if (window.C4AccessibilityManager) {
            window.C4AccessibilityManager.enhanceElementAccessibility(container);
        }
    }
    
    logPerformance(message, data = null) {
        if (console.group) {
            console.group(`🚀 C4 Performance: ${message}`);
            if (data) console.log(data);
            console.groupEnd();
        } else {
            console.log(`🚀 C4 Performance: ${message}`, data);
        }
    }
    
    // Métodos públicos para uso externo
    static preloadResource(url, type = 'script') {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url;
        if (type !== 'script') {
            link.as = type;
        }
        document.head.appendChild(link);
    }
    
    static getMetrics() {
        return window.C4PerformanceManager?.performanceMetrics || {};
    }
}

// Inicialização automática
document.addEventListener('DOMContentLoaded', () => {
    window.C4PerformanceManager = new C4PerformanceManager();
});

// Exportar para uso global
window.C4 = window.C4 || {};
window.C4.PerformanceManager = C4PerformanceManager;

