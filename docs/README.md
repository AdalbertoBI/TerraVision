# Terra Vision

Plataforma web livre para musicoterapia controlada por olhar. Todo o código do projeto e das dependências necessárias é aberto, sem cadastros, assinaturas ou serviços com limites de uso. A proposta é garantir que qualquer equipe terapêutica possa baixar o repositório, executar localmente e manter o sistema funcionando de forma autônoma.

## Filosofia de Software Livre

- **Zero barreiras**: nenhum componente exige conta, chave de API ou pagamento.
- **Dependências locais**: o rastreamento ocular usa o projeto aberto [WebGazer.js](https://github.com/brownhci/WebGazer). A biblioteca é baixada para `libs/webgazer.js`, evitando chamadas externas obrigatórias.
- **Hospedagem própria**: basta um servidor estático gratuito (por exemplo, `python -m http.server`). A aplicação pode rodar offline após o primeiro download das bibliotecas.

## Funcionalidades Atuais

- Pizza musical colorida que ocupa toda a tela, com fatias destacadas conforme o usuário mira.
- Botão central “Calibrar” que controla todo o fluxo de gaze; ativação com dwell + piscada.
- Calibração de nove pontos com armazenamento opcional no navegador.
- Síntese de notas pelo Web Audio API (sem arquivos licenciados ou restritos).
- Indicador visual do olhar e mensagens guiando o uso terapêutico.
- Módulos adicionais (terapia, acessibilidade) disponíveis no código para extensão futura, todos implementados apenas com recursos gratuitos.

## Tecnologias 100% Abertas

- HTML5, CSS3 e JavaScript (ES Modules).
- Web Audio API para geração de som.
- WebGazer.js (licença MIT) hospedado localmente em `libs/`.
- `localStorage` para gravação de calibração e preferências.

## Estrutura do Projeto

```text
Terra_vision/
├── index.html        # Layout minimalista (canvas + botão Calibrar) e carregamento das libs abertas
├── style.css         # Estilos principais da pizza, status e overlay de calibração
├── notes.json        # Notas musicais disponíveis no círculo
├── src/
│   ├── audio.js          # Síntese de áudio utilizando somente Web Audio API
│   ├── blinkDetector.js  # Detector de piscadas baseado em métricas abertas (EAR)
│   ├── calibration.js    # Fluxo de calibração e persistência local
│   ├── config.js         # Constantes globais do app
│   ├── controlManager.js # Lógica de dwell + piscada para o botão calibrar
│   ├── gazeTracker.js    # Wrapper do WebGazer com thresholds configuráveis
│   ├── pizzaRenderer.js  # Desenho do círculo de notas
│   ├── therapyMode.js    # Módulo opcional de sessões terapêuticas
│   ├── ui.js             # Utilidades de interface e status
│   └── main.js           # Ponto de entrada que orquestra tudo
├── libs/                 # Onde o WebGazer local é armazenado (script de download incluso)
├── sounds/               # Pasta opcional para timbres personalizados
└── docs/README.md        # Este guia
```

## Pré-requisitos

- Navegador moderno com suporte a webcam, Web Audio e ES Modules (Chrome, Edge, Firefox ou Safari atuais).
- Webcam funcional.
- Servidor local respondendo em `http://localhost` (o WebGazer bloqueia outros hosts sem HTTPS).
- Arquivo `libs/webgazer.js` disponível localmente. Scripts prontos ajudam a baixar a versão livre oficial.

## Passo a Passo para Executar

1. **Clonar o repositório**

   ```bash
   git clone https://github.com/AdalbertoBI/TerraVision.git
   cd TerraVision
   ```

2. **Instalar o WebGazer local (apenas código aberto):**

   - Windows:

     ```cmd
     script\setup-webgazer.bat
     ```

   - macOS / Linux:

     ```bash
     bash script/setup-webgazer.sh
     ```

   Os scripts fazem download do arquivo livre `webgazer.js` diretamente do repositório oficial e salvam em `libs/`.

3. **Subir um servidor estático gratuito** (escolha apenas um):

   - Python 3 (recomendado e já presente em várias instalações):

     ```bash
     python -m http.server 8000
     ```

   - Node.js (usando a ferramenta open source `http-server`):

     ```bash
     npx http-server -p 8000 --cors
     ```

4. **Abrir o navegador em** `http://localhost:8000`

   > Importante: use exatamente `localhost`. Endereços como `127.0.0.1` ou IPs da rede podem ser bloqueados pelo WebGazer.

5. **Conceder permissão da webcam** e iniciar a calibração pelo botão central.

## Independência de Serviços

- Todas as bibliotecas são de código aberto e estão armazenadas localmente.
- O sistema não envia dados para servidores de terceiros.
- Executa em qualquer máquina com navegador moderno, mesmo sem internet (após baixar as dependências abertas uma única vez).

## Personalização de Áudio

O sintetizador integrado cobre todo o uso terapêutico. Se desejar timbres específicos, basta adicionar arquivos em `sounds/` e adaptar a engine. Nenhum pacote pago é necessário.

## Boas Práticas Terapêuticas

- Explique ao paciente por que a webcam é usada e como os dados ficam apenas na máquina local.
- Mantenha o ambiente iluminado para melhorar a acurácia.
- Repita a calibração ao trocar de posição ou dispositivo.

## Licença

Defina a licença de software livre que preferir (recomendação: MIT ou Apache-2.0). Enquanto não definida, todos os direitos permanecem reservados ao autor original.
