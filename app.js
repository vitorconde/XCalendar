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
    
    // Categorias de anotações
    const categories = {
        'geral': { name: 'Geral', color: '#4a6fa5' },
        'saude': { name: 'Saúde', color: '#e74c3c' },
        'exercicios': { name: 'Exercícios', color: '#2ecc71' },
        'alimentacao': { name: 'Alimentação', color: '#f39c12' }
    };

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
        
        // Habilitar/desabilitar botão de salvar com base no conteúdo
        dailyNote.addEventListener('input', () => {
            document.getElementById('saveNote').disabled = !dailyNote.value.trim();
        });
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
        const dayNotes = notes[dateKey] || { [currentCategory]: [] };
        
        // Limpar campo de entrada
        dailyNote.value = '';
        
        // Atualizar categorias ativas
        noteCategories.forEach(cat => {
            if (cat.dataset.category === currentCategory) {
                cat.classList.add('active');
            } else {
                cat.classList.remove('active');
            }
        });
        
        // Exibir notas existentes
        renderNotes(dayNotes[currentCategory] || []);
    }
    
    // Renderizar notas na interface
    function renderNotes(notesList) {
        const notesFeed = document.getElementById('notesFeed');
        notesFeed.innerHTML = '';
        
        if (!notesList || notesList.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            emptyState.textContent = 'Nenhuma anotação para este dia. Adicione uma acima!';
            emptyState.style.textAlign = 'center';
            emptyState.style.padding = '20px';
            emptyState.style.color = 'var(--secondary-color)';
            notesFeed.appendChild(emptyState);
            return;
        }
        
        // Ordenar notas por data (mais recentes primeiro)
        const sortedNotes = [...notesList].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        sortedNotes.forEach((note, index) => {
            const noteElement = createNoteElement(note, index);
            notesFeed.appendChild(noteElement);
        });
    }
    
    // Criar elemento de nota
    function createNoteElement(note, index) {
        const noteElement = document.createElement('div');
        noteElement.className = 'note-post';
        
        const category = categories[note.category] || categories.geral;
        const date = new Date(note.timestamp);
        const timeString = date.toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        noteElement.innerHTML = `
            <div class="note-post-header">
                <span>${timeString}</span>
                <span class="note-category-badge" style="background-color: ${category.color}20; color: ${category.color}">
                    ${category.name}
                </span>
                <span class="note-time">${formatRelativeTime(date)}</span>
            </div>
            <div class="note-content">${escapeHtml(note.text)}</div>
            <div class="note-actions">
                <button class="note-action delete" data-index="${index}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    Excluir
                </button>
            </div>
        `;
        
        // Adicionar evento de clique para o botão de excluir
        const deleteBtn = noteElement.querySelector('.delete');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteNote(index);
            });
        }
        
        return noteElement;
    }
    
    // Formatador de tempo relativo (ex: "há 2 minutos")
    function formatRelativeTime(date) {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) return 'agora';
        
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) return `há ${diffInMinutes} min`;
        
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `há ${diffInHours} h`;
        
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays === 1) return 'ontem';
        if (diffInDays < 7) return `há ${diffInDays} dias`;
        
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
        });
    }
    
    // Função auxiliar para escapar HTML
    function escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;')
            .replace(/\n/g, '<br>');
    }

    // Salvar nova nota
    function saveNote() {
        const noteText = dailyNote.value.trim();
        if (!noteText) return;
        
        const dateKey = formatDateKey(selectedDate);
        const timestamp = new Date().toISOString();
        
        // Criar estrutura de dados da nota
        const newNote = {
            text: noteText,
            category: currentCategory,
            timestamp: timestamp
        };
        
        // Inicializar estruturas de dados se não existirem
        if (!notes[dateKey]) {
            notes[dateKey] = {};
        }
        if (!Array.isArray(notes[dateKey][currentCategory])) {
            notes[dateKey][currentCategory] = [];
        }
        
        // Adicionar a nova nota
        notes[dateKey][currentCategory].push(newNote);
        
        // Salvar no localStorage
        localStorage.setItem('xcalendar-notes', JSON.stringify(notes));
        
        // Atualizar a interface
        renderNotes(notes[dateKey][currentCategory]);
        
        // Limpar o campo de entrada
        dailyNote.value = '';
        
        // Rolar para a nova nota
        const notesFeed = document.getElementById('notesFeed');
        notesFeed.scrollTop = 0;
    }
    
    // Excluir nota
    function deleteNote(noteIndex) {
        const dateKey = formatDateKey(selectedDate);
        if (!notes[dateKey] || !notes[dateKey][currentCategory]) return;
        
        // Remover a nota do array
        notes[dateKey][currentCategory].splice(noteIndex, 1);
        
        // Atualizar o localStorage
        localStorage.setItem('xcalendar-notes', JSON.stringify(notes));
        
        // Atualizar a interface
        renderNotes(notes[dateKey][currentCategory]);
    }

    // Limpar nota
    function clearNote() {
        dailyNote.value = '';
        saveNote();
    }

    // Trocar categoria de notas
    function switchCategory(category) {
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
