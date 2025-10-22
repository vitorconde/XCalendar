// Configuração inicial
document.addEventListener('DOMContentLoaded', () => {
    // Elementos do DOM
    const currentMonthElement = document.getElementById('currentMonth');
    const calendarDays = document.getElementById('calendarDays');
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');
    const themeToggle = document.getElementById('themeToggle');
    const dailyNote = document.getElementById('dailyNote');
    const saveNoteBtn = document.getElementById('saveNote');
    const clearNoteBtn = document.getElementById('clearNote');
    const noteCategories = document.querySelectorAll('.note-category');
    const syncButtons = {
        google: document.getElementById('syncGoogle'),
        outlook: document.getElementById('syncOutlook'),
        apple: document.getElementById('syncApple')
    };

    // Estado da aplicação
    let currentDate = new Date();
    let selectedDate = new Date();
    let currentCategory = 'geral';
    let notes = JSON.parse(localStorage.getItem('xcalendar-notes') || '{}');
    let theme = localStorage.getItem('xcalendar-theme') || 'light';

    // Inicialização
    function init() {
        // Aplicar tema salvo
        document.body.setAttribute('data-theme', theme);
        
        // Configurar eventos
        setupEventListeners();
        
        // Renderizar calendário
        renderCalendar();
        
        // Carregar notas do dia atual
        loadDailyNotes();
    }

    // Configurar event listeners
    function setupEventListeners() {
        // Navegação do calendário
        prevMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar();
        });

        nextMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar();
        });

        // Alternar tema
        themeToggle.addEventListener('click', toggleTheme);

        // Gerenciamento de notas
        saveNoteBtn.addEventListener('click', saveNote);
        clearNoteBtn.addEventListener('click', clearNote);
        
        // Categorias de notas
        noteCategories.forEach(category => {
            category.addEventListener('click', () => switchCategory(category.dataset.category));
        });

        // Botões de sincronização
        syncButtons.google.addEventListener('click', () => syncCalendar('google'));
        syncButtons.outlook.addEventListener('click', () => syncCalendar('outlook'));
        syncButtons.apple.addEventListener('click', () => syncCalendar('apple'));

        // Atualizar tema baseado na hora do dia
        updateTimeBasedTheme();
        setInterval(updateTimeBasedTheme, 60000); // Verificar a cada minuto
    }

    // Renderizar o calendário
    function renderCalendar() {
        // Atualizar cabeçalho do mês/ano
        currentMonthElement.textContent = currentDate.toLocaleDateString('pt-BR', {
            month: 'long',
            year: 'numeric'
        }).replace(/^\w/, c => c.toUpperCase());

        // Limpar dias do calendário
        calendarDays.innerHTML = '';

        // Obter primeiro dia do mês e último dia do mês
        const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        
        // Dias da semana (0 = Domingo, 1 = Segunda, etc.)
        const firstDayIndex = firstDay.getDay();
        const lastDayIndex = lastDay.getDay();
        const lastDayOfLastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate();

        // Dias do mês anterior
        for (let i = firstDayIndex; i > 0; i--) {
            const dayElement = createDayElement(lastDayOfLastMonth - i + 1, true);
            calendarDays.appendChild(dayElement);
        }

        // Dias do mês atual
        for (let i = 1; i <= lastDay.getDate(); i++) {
            const dayElement = createDayElement(i, false);
            
            // Marcar dia atual
            const today = new Date();
            if (i === today.getDate() && 
                currentDate.getMonth() === today.getMonth() && 
                currentDate.getFullYear() === today.getFullYear()) {
                dayElement.classList.add('today');
            }
            
            // Marcar dia selecionado
            if (i === selectedDate.getDate() && 
                currentDate.getMonth() === selectedDate.getMonth() && 
                currentDate.getFullYear() === selectedDate.getFullYear()) {
                dayElement.classList.add('selected');
            }
            
            calendarDays.appendChild(dayElement);
        }

        // Dias do próximo mês
        const daysToAdd = 42 - (firstDayIndex + lastDay.getDate()); // 6 linhas de 7 dias
        for (let i = 1; i <= daysToAdd; i++) {
            const dayElement = createDayElement(i, true);
            calendarDays.appendChild(dayElement);
        }
    }

    // Criar elemento de dia
    function createDayElement(day, isOtherMonth) {
        const dayElement = document.createElement('div');
        dayElement.classList.add('day');
        if (isOtherMonth) dayElement.classList.add('other-month');
        
        dayElement.textContent = day;
        
        // Adicionar event listener para selecionar o dia
        dayElement.addEventListener('click', () => selectDay(day));
        
        return dayElement;
    }

    // Selecionar dia
    function selectDay(day) {
        // Salvar nota atual antes de mudar de dia
        saveNote();
        
        // Atualizar data selecionada
        selectedDate = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            day
        );
        
        // Atualizar UI
        renderCalendar();
        loadDailyNotes();
    }

    // Alternar tema
    function toggleTheme() {
        theme = theme === 'light' ? 'dark' : 'light';
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('xcalendar-theme', theme);
    }

    // Atualizar tema baseado na hora do dia
    function updateTimeBasedTheme() {
        const hour = new Date().getHours();
        let timeOfDay = 'day'; // padrão
        
        if (hour >= 5 && hour < 12) timeOfDay = 'morning';
        else if (hour >= 12 && hour < 18) timeOfDay = 'day';
        else if (hour >= 18 && hour < 22) timeOfDay = 'evening';
        else timeOfDay = 'night';
        
        // Aplicar classes CSS baseadas no período do dia
        document.body.className = '';
        document.body.classList.add(`time-${timeOfDay}`);
    }

    // Carregar notas do dia selecionado
    function loadDailyNotes() {
        const dateKey = formatDateKey(selectedDate);
        const dayNotes = notes[dateKey] || {};
        
        // Carregar nota da categoria atual
        dailyNote.value = dayNotes[currentCategory] || '';
        
        // Atualiar categorias ativas
        noteCategories.forEach(cat => {
            if (cat.dataset.category === currentCategory) {
                cat.classList.add('active');
            } else {
                cat.classList.remove('active');
            }
        });
    }

    // Salvar nota
    function saveNote() {
        if (!dailyNote.value.trim()) return;
        
        const dateKey = formatDateKey(selectedDate);
        
        if (!notes[dateKey]) {
            notes[dateKey] = {};
        }
        
        notes[dateKey][currentCategory] = dailyNote.value.trim();
        localStorage.setItem('xcalendar-notes', JSON.stringify(notes));
    }

    // Limpar nota
    function clearNote() {
        dailyNote.value = '';
        saveNote();
    }

    // Trocar categoria de notas
    function switchCategory(category) {
        // Salvar nota atual antes de trocar de categoria
        saveNote();
        
        // Atualizar categoria atual
        currentCategory = category;
        
        // Atualizar UI
        loadDailyNotes();
    }

    // Sincronizar com calendário externo
    async function syncCalendar(provider) {
        try {
            // Aqui você implementaria a lógica de autenticação com a API do provedor
            // Por enquanto, apenas um placeholder
            alert(`Conectando com ${provider}...`);
            // Implementação real usaria a API do provedor específico
        } catch (error) {
            console.error(`Erro ao sincronizar com ${provider}:`, error);
            alert(`Erro ao conectar com ${provider}. Por favor, tente novamente.`);
        }
    }

    // Função auxiliar para formatar chave de data
    function formatDateKey(date) {
        return date.toISOString().split('T')[0]; // Formato YYYY-MM-DD
    }

    // Inicializar a aplicação
    init();
});
