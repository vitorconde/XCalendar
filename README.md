# XCalendar - Seu Calendário Pessoal

![XCalendar Logo](icons/icon128.png)

XCalendar é uma extensão de navegador que oferece um calendário pessoal completo, permitindo que você sincronize seus compromissos dos principais serviços de calendário (Google, Outlook e Apple) em um único lugar. Além disso, você pode adicionar anotações pessoais sobre seu dia a dia, como alimentação, exercícios, medicamentos e muito mais.

## Recursos Principais

- **Sincronização com múltiplos calendários** (Google, Outlook, Apple)
- **Anotações diárias** com categorias personalizáveis
- **Interface limpa e responsiva** que se adapta ao período do dia
- **Temas claro e escuro**
- **Offline-first** - suas anotações são salvas localmente
- **Sincronização em nuvem** (opcional)
- **Lembretes** para suas anotações diárias

## Como Instalar

### No Chrome/Opera (modo desenvolvedor)

1. Baixe ou clone este repositório
2. Acesse `chrome://extensions/` no seu navegador
3. Ative o "Modo do desenvolvedor" no canto superior direito
4. Clique em "Carregar sem compactação"
5. Selecione a pasta do projeto

### No Firefox

1. Acesse `about:debugging#/runtime/this-firefox`
2. Clique em "Carregar complemento temporário"
3. Selecione qualquer arquivo da extensão

## Configuração

Para habilitar a sincronização com os serviços de calendário, você precisará configurar as credenciais OAuth2:

1. **Google Calendar**:
   - Acesse o [Google Cloud Console](https://console.cloud.google.com/)
   - Crie um novo projeto
   - Habilite a API do Google Calendar
   - Crie credenciais OAuth 2.0
   - Adicione `http://localhost` e `https://<seu-dominio>.chromiumapp.org` como URIs de redirecionamento
   - Substitua `SEU_CLIENT_ID_GOOGLE` no arquivo `background.js`

2. **Microsoft Outlook**:
   - Acesse o [Portal do Azure](https://portal.azure.com/)
   - Registre um novo aplicativo
   - Adicione permissões para a API do Microsoft Graph (Calendars.Read)
   - Gere um segredo do cliente
   - Substitua `SEU_CLIENT_ID_MICROSOFT` no arquivo `background.js`

3. **Apple Calendar**:
   - Acesse o [Apple Developer Portal](https://developer.apple.com/)
   - Registre um novo identificador de aplicativo
   - Habilite o serviço "Sign In with Apple"
   - Configure as URLs de retorno
   - Substitua `SEU_CLIENT_ID_APPLE` no arquivo `background.js`

## Estrutura do Projeto

```
XCalendar/
├── icons/                   # Ícones da extensão
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── js/
│   ├── app.js              # Lógica principal da aplicação
│   └── background.js       # Service Worker para sincronização
├── styles/
│   └── main.css            # Estilos da aplicação
├── popup.html              # Interface principal
├── manifest.json           # Configuração da extensão
└── README.md               # Este arquivo
```

## Desenvolvimento

### Pré-requisitos

- Node.js (opcional, para desenvolvimento)
- Navegador baseado em Chromium (Chrome, Edge, Opera, etc.) ou Firefox

### Scripts úteis

- `npm install` - Instala as dependências (se houver)
- `npm run build` - Constrói a extensão para produção
- `npm run dev` - Inicia o servidor de desenvolvimento

## Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues e enviar pull requests.

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas alterações (`git commit -m 'Add some AmazingFeature'`)
4. Faça o push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença

Distribuído sob a licença MIT. Veja `LICENSE` para mais informações.

## Contato

Link do Projeto: [https://github.com/seu-usuario/XCalendar](https://github.com/seu-usuario/XCalendar)

## Agradecimentos

- [Google Calendar API](https://developers.google.com/calendar)
- [Microsoft Graph API](https://docs.microsoft.com/en-us/graph/)
- [Apple Developer Documentation](https://developer.apple.com/documentation/)
- [MDN Web Docs](https://developer.mozilla.org/)
