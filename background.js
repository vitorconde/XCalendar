// Configuração de autenticação OAuth
const AUTH_CONFIG = {
    google: {
        clientId: 'SEU_CLIENT_ID_GOOGLE',
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        scopes: [
            'https://www.googleapis.com/auth/calendar.readonly',
            'https://www.googleapis.com/auth/calendar.events.readonly'
        ]
    },
    microsoft: {
        clientId: 'SEU_CLIENT_ID_MICROSOFT',
        authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        scopes: [
            'openid',
            'profile',
            'offline_access',
            'https://outlook.office.com/calendars.read'
        ]
    },
    apple: {
        // A autenticação da Apple requer configuração adicional no portal do desenvolvedor
        clientId: 'SEU_CLIENT_ID_APPLE',
        redirectUri: 'https://sua-extensao.com/auth/apple/callback',
        scopes: ['name', 'email']
    }
};

// Gerenciador de autenticação
class AuthManager {
    constructor() {
        this.tokens = {};
        this.loadTokens();
    }

    async loadTokens() {
        const data = await chrome.storage.local.get('authTokens');
        this.tokens = data.authTokens || {};
    }

    async saveTokens() {
        await chrome.storage.local.set({ authTokens: this.tokens });
    }

    async authenticate(provider) {
        const config = AUTH_CONFIG[provider];
        if (!config) throw new Error('Provedor não suportado');

        // Implementar lógica de autenticação OAuth aqui
        // Esta é uma implementação simplificada
        return new Promise((resolve, reject) => {
            chrome.identity.launchWebAuthFlow({
                url: this.buildAuthUrl(provider),
                interactive: true
            }, (responseUrl) => {
                if (chrome.runtime.lastError) {
                    return reject(chrome.runtime.lastError);
                }
                // Processar a resposta e obter o token
                this.processAuthResponse(provider, responseUrl)
                    .then(resolve)
                    .catch(reject);
            });
        });
    }

    buildAuthUrl(provider) {
        const config = AUTH_CONFIG[provider];
        const params = new URLSearchParams({
            client_id: config.clientId,
            redirect_uri: chrome.identity.getRedirectURL('oauth2'),
            response_type: 'code',
            scope: config.scopes.join(' '),
            access_type: 'offline',
            prompt: 'consent'
        });

        return `${config.authUrl}?${params.toString()}`;
    }

    async processAuthResponse(provider, responseUrl) {
        // Extrair código de autorização da URL
        const url = new URL(responseUrl);
        const code = url.searchParams.get('code');
        
        if (!code) {
            throw new Error('Código de autorização não encontrado');
        }

        // Trocar código por token de acesso
        const tokenResponse = await this.exchangeCodeForToken(provider, code);
        
        // Salvar tokens
        this.tokens[provider] = {
            accessToken: tokenResponse.access_token,
            refreshToken: tokenResponse.refresh_token,
            expiresAt: Date.now() + (tokenResponse.expires_in * 1000)
        };
        
        await this.saveTokens();
        
        return { success: true, provider };
    }

    async exchangeCodeForToken(provider, code) {
        const config = AUTH_CONFIG[provider];
        const response = await fetch(config.tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                client_id: config.clientId,
                code,
                grant_type: 'authorization_code',
                redirect_uri: chrome.identity.getRedirectURL('oauth2')
            })
        });

        if (!response.ok) {
            throw new Error('Falha ao obter token de acesso');
        }

        return response.json();
    }

    async getAccessToken(provider) {
        const token = this.tokens[provider];
        if (!token) return null;

        // Verificar se o token expirou
        if (Date.now() >= token.expiresAt) {
            await this.refreshToken(provider);
        }

        return this.tokens[provider].accessToken;
    }

    async refreshToken(provider) {
        const token = this.tokens[provider];
        if (!token?.refreshToken) {
            throw new Error('Nenhum token de atualização disponível');
        }

        const config = AUTH_CONFIG[provider];
        const response = await fetch(config.tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                client_id: config.clientId,
                refresh_token: token.refreshToken,
                grant_type: 'refresh_token'
            })
        });

        if (!response.ok) {
            throw new Error('Falha ao atualizar token');
        }

        const data = await response.json();
        this.tokens[provider] = {
            ...this.tokens[provider],
            accessToken: data.access_token,
            expiresAt: Date.now() + (data.expires_in * 1000)
        };

        await this.saveTokens();
    }
}

// Gerenciador de sincronização de calendário
class CalendarSyncManager {
    constructor(authManager) {
        this.authManager = authManager;
    }

    async syncEvents(provider, startDate, endDate) {
        const accessToken = await this.authManager.getAccessToken(provider);
        if (!accessToken) {
            throw new Error('Não autenticado');
        }

        switch (provider) {
            case 'google':
                return this.syncGoogleCalendar(accessToken, startDate, endDate);
            case 'microsoft':
                return this.syncOutlookCalendar(accessToken, startDate, endDate);
            case 'apple':
                return this.syncAppleCalendar(accessToken, startDate, endDate);
            default:
                throw new Error('Provedor não suportado');
        }
    }

    async syncGoogleCalendar(accessToken, startDate, endDate) {
        // Implementar sincronização com Google Calendar
        // Esta é uma implementação de exemplo
        const timeMin = startDate.toISOString();
        const timeMax = endDate.toISOString();
        
        const response = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
            `timeMin=${encodeURIComponent(timeMin)}&` +
            `timeMax=${encodeURIComponent(timeMax)}&` +
            'singleEvents=true&orderBy=startTime',
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json'
                }
            }
        );

        if (!response.ok) {
            throw new Error('Falha ao buscar eventos do Google Calendar');
        }

        const data = await response.json();
        return data.items || [];
    }

    async syncOutlookCalendar(accessToken, startDate, endDate) {
        // Implementar sincronização com Outlook Calendar
        // Esta é uma implementação de exemplo
        const startDateTime = startDate.toISOString();
        const endDateTime = endDate.toISOString();
        
        const response = await fetch(
            `https://outlook.office.com/api/v2.0/me/calendarview?` +
            `startDateTime=${encodeURIComponent(startDateTime)}&` +
            `endDateTime=${encodeURIComponent(endDateTime)}`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json'
                }
            }
        );

        if (!response.ok) {
            throw new Error('Falha ao buscar eventos do Outlook Calendar');
        }

        const data = await response.json();
        return data.value || [];
    }

    async syncAppleCalendar(accessToken, startDate, endDate) {
        // A sincronização com Apple Calendar requer configuração adicional
        // Esta é apenas uma implementação de exemplo
        throw new Error('Sincronização com Apple Calendar não implementada');
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    const authManager = new AuthManager();
    const calendarSyncManager = new CalendarSyncManager(authManager);

    // Expor funções para a UI
    window.authManager = authManager;
    window.calendarSyncManager = calendarSyncManager;

    // Sincronizar eventos periodicamente (a cada hora)
    setInterval(async () => {
        try {
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + 30); // Próximos 30 dias

            const providers = Object.keys(AUTH_CONFIG);
            for (const provider of providers) {
                if (await authManager.getAccessToken(provider)) {
                    const events = await calendarSyncManager.syncEvents(provider, startDate, endDate);
                    console.log(`Sincronizados ${events.length} eventos do ${provider}`);
                    // Aqui você poderia processar e armazenar os eventos
                }
            }
        } catch (error) {
            console.error('Erro na sincronização de calendários:', error);
        }
    }, 60 * 60 * 1000); // A cada hora
});
