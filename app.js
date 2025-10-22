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

        // Atualizar título da seção de anotações
        updateNotesHeader();

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
            const day = lastDayOfLastMonth - i + 1;
            const dayElement = createDayElement(day, true);
            
            // Verificar se há anotações neste dia
            const tempDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, day);
            if (hasNotesForDate(tempDate)) {
                dayElement.classList.add('has-notes');
            }
            
            calendarDays.appendChild(dayElement);
        }

        // Dias do mês atual
        for (let i = 1; i <= lastDay.getDate(); i++) {
            const dayElement = createDayElement(i, false);
            const tempDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
            
            // Marcar dia atual
            const today = new Date();
            const isToday = i === today.getDate() && 
                          currentDate.getMonth() === today.getMonth() && 
                          currentDate.getFullYear() === today.getFullYear();
            
            if (isToday) {
                dayElement.classList.add('today');
            }
            
            // Atualizar indicadores de eventos
            updateEventIndicators(dayElement, tempDate);
            
            // Marcar dia selecionado
            const isSelected = i === selectedDate.getDate() && 
                             currentDate.getMonth() === selectedDate.getMonth() && 
                             currentDate.getFullYear() === selectedDate.getFullYear();
            
            if (isSelected) {
                dayElement.classList.add('selected');
                
                // Se for o dia atual, rolar para o topo
                if (isToday) {
                    setTimeout(() => {
                        const notesContainer = document.querySelector('.notes-container');
                        notesContainer.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                }
            }
            
            calendarDays.appendChild(dayElement);
        }

        // Dias do próximo mês
        const daysToAdd = 42 - (firstDayIndex + lastDay.getDate()); // 6 linhas de 7 dias
        for (let i = 1; i <= daysToAdd; i++) {
            const dayElement = createDayElement(i, true);
            
            // Verificar se há anotações neste dia
            const tempDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i);
            if (hasNotesForDate(tempDate)) {
                dayElement.classList.add('has-notes');
            }
            
            calendarDays.appendChild(dayElement);
        }
    }

    // Função auxiliar para criar elementos de dia
    function createDayElement(day, isOtherMonth) {
        const dayElement = document.createElement('div');
        dayElement.className = `day ${isOtherMonth ? 'other-month' : ''}`;
        
        // Criar elemento para o número do dia
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = day;
        dayElement.appendChild(dayNumber);
        
        // Criar container para os pontos de evento
        const eventDots = document.createElement('div');
        eventDots.className = 'event-dots';
        dayElement.appendChild(eventDots);
        
        // Adicionar evento de clique
        dayElement.addEventListener('click', () => {
            selectDay(day, isOtherMonth);
        });
        
        return dayElement;
    }

    // Função para atualizar os indicadores de eventos em um dia
    function updateEventIndicators(dayElement, date) {
        const dateKey = formatDateKey(date);
        const dayNotes = notes[dateKey] || {};
        const eventDots = dayElement.querySelector('.event-dots');
        eventDots.innerHTML = ''; // Limpar indicadores existentes
        
        // Criar um mapa para armazenar contagens por categoria e fonte
        const eventMap = {};
        
        // Contar eventos por categoria e fonte
        Object.entries(dayNotes).forEach(([category, categoryNotes]) => {
            if (categoryNotes && categoryNotes.length > 0) {
                if (!eventMap[category]) {
                    eventMap[category] = { count: 0, sources: {} };
                }
                eventMap[category].count += categoryNotes.length;
                
                // Contar por fonte
                categoryNotes.forEach(note => {
                    const source = note.source || 'geral';
                    eventMap[category].sources[source] = (eventMap[category].sources[source] || 0) + 1;
                });
            }
        });
        
        // Limitar a 4 indicadores (um para cada categoria)
        const maxDots = 4;
        let dotCount = 0;
        
        // Ordenar categorias por quantidade de eventos (mais eventos primeiro)
        const sortedCategories = Object.entries(eventMap)
            .sort((a, b) => b[1].count - a[1].count);
        
        // Adicionar indicadores para cada categoria
        for (const [category, data] of sortedCategories) {
            if (dotCount >= maxDots) break;
            
            const dot = document.createElement('div');
            dot.className = `event-dot ${category}`;
            
            // Criar tooltip com detalhes
            const sourceTexts = [];
            for (const [source, count] of Object.entries(data.sources)) {
                sourceTexts.push(`${count} ${source}${count > 1 ? 's' : ''}`);
            }
            
            dot.title = `${category.charAt(0).toUpperCase() + category.slice(1)}: ${data.count} evento(s) (${sourceTexts.join(', ')})`;
            eventDots.appendChild(dot);
            dotCount++;
        }
        
        // Adicionar/remover classe has-notes
        if (Object.keys(dayNotes).length > 0) {
            dayElement.classList.add('has-notes');
        } else {
            dayElement.classList.remove('has-notes');
        }
    }

    // Selecionar dia
    function selectDay(day, isOtherMonth = false) {
        // Salvar nota atual antes de mudar de dia
        saveNote();
        
        // Se for um dia de outro mês, ajustar o mês/ano
        if (isOtherMonth) {
            // Verificar se o dia é do mês anterior ou próximo
            if (day > 15) {
                // É um dia do mês anterior
                currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
            } else {
                // É um dia do próximo mês
                currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
            }
            
            // Atualizar o calendário com o novo mês
            renderCalendar();
        }
        
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
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`; // Formato YYYY-MM-DD
    }
    
    // Verificar se existem anotações para uma data específica
    function hasNotesForDate(date) {
        const dateKey = formatDateKey(date);
        return notes[dateKey] && Object.values(notes[dateKey]).some(categoryNotes => 
            Array.isArray(categoryNotes) && categoryNotes.length > 0
        );
    }
    
    // Atualizar o cabeçalho da seção de anotações com a data selecionada
    function updateNotesHeader() {
        const notesHeader = document.querySelector('.notes-container h3');
        if (!notesHeader) return;
        
        const today = new Date();
        const isToday = selectedDate.toDateString() === today.toDateString();
        const isPast = selectedDate < today && !isToday;
        
        let dateString = selectedDate.toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        
        // Capitalizar o primeiro caractere
        dateString = dateString.charAt(0).toUpperCase() + dateString.slice(1);
        
        // Adicionar indicador de hoje ou passado
        if (isToday) {
            dateString += ' (Hoje)';
        } else if (isPast) {
            dateString += ' (Passado)';
        } else if (selectedDate > today) {
            dateString += ' (Futuro)';
        }
        
        notesHeader.textContent = `Anotações - ${dateString}`;
    }

    // Inicializar a aplicação
    init();
});
