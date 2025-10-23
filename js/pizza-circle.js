/**
 * Terra Vision - Pizza Circle
 * Gerencia o desenho e interação com o círculo de notas musicais
 * Divide o círculo em fatias (pizza) para cada nota
 */

class PizzaCircle {
    /**
     * Inicializa o círculo pizza
     * @param {HTMLCanvasElement} canvas - Canvas para desenhar
     * @param {AudioManager} audioManager - Gerenciador de áudio
     * @param {number} slices - Número de fatias (padrão: 8)
     */
    constructor(canvas, audioManager, slices = 8) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.audioManager = audioManager;
        this.slices = slices;
        
        // Dimensões
        this.centerX = 0;
        this.centerY = 0;
        this.radius = 0;
        this.innerRadius = 0;
        
        // Estado
        this.focusedSlice = -1;
        this.hoveredSlice = -1;
        this.selectedSlice = -1;
        
        // Cores
        this.colors = [
            '#FF6B6B', // Vermelho
            '#FF8C42', // Laranja
            '#FFD93D', // Amarelo
            '#6BCB77', // Verde
            '#4D96FF', // Azul
            '#9D84B7', // Roxo
            '#FF6B9D', // Rosa
            '#00D4FF'  // Ciano
        ];
        
        this.focusColor = '#FFD93D';
        this.selectedColor = '#00FF00';
        
        // Callbacks
        this.callbacks = {
            onSliceHover: () => {},
            onSliceClick: () => {}
        };
        
        // Setup
        this.updateDimensions();
        window.addEventListener('resize', () => this.updateDimensions());
        
        // Mouse listeners (para testes)
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
    }

    /**
     * Atualiza as dimensões do canvas e círculo
     */
    updateDimensions() {
        if (this.canvas.parentElement) {
            const rect = this.canvas.parentElement.getBoundingClientRect();
            this.canvas.width = rect.width;
            this.canvas.height = rect.height;
        }
        
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        
        // Define raios baseado no menor lado
        const maxRadius = Math.min(this.centerX, this.centerY) * 0.8;
        this.radius = maxRadius;
        this.innerRadius = maxRadius * 0.4;
    }

    /**
     * Desenha o círculo pizza completo
     */
    draw() {
        // Limpa canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Desenha fundo
        this.drawBackground();
        
        // Desenha cada fatia
        for (let i = 0; i < this.slices; i++) {
            this.drawSlice(i);
        }
        
        // Desenha círculo central
        this.drawCenterCircle();
        
        // Desenha detalhes finais
        this.drawBorder();
    }

    /**
     * Desenha fundo do círculo
     */
    drawBackground() {
        const gradient = this.ctx.createRadialGradient(this.centerX, this.centerY, 0, this.centerX, this.centerY, this.radius);
        gradient.addColorStop(0, 'rgba(0, 168, 255, 0.05)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, this.radius, 0, 2 * Math.PI);
        this.ctx.fill();
    }

    /**
     * Desenha uma fatia individual
     * @param {number} index - Índice da fatia
     */
    drawSlice(index) {
        const angleSlice = (2 * Math.PI) / this.slices;
        const startAngle = index * angleSlice - Math.PI / 2;
        const endAngle = (index + 1) * angleSlice - Math.PI / 2;
        
        // Define cor baseado no estado
        let color = this.colors[index % this.colors.length];
        let lineWidth = 2;
        let shadowBlur = 0;
        
        if (index === this.focusedSlice) {
            color = this.focusColor;
            lineWidth = 4;
            shadowBlur = 20;
        }
        
        if (index === this.selectedSlice) {
            color = this.selectedColor;
            lineWidth = 5;
            shadowBlur = 30;
        }
        
        // Aplica sombra se foco ou selecionado
        if (shadowBlur > 0) {
            this.ctx.shadowColor = color;
            this.ctx.shadowBlur = shadowBlur;
        }
        
        // Desenha a fatia
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.moveTo(this.centerX, this.centerY);
        this.ctx.arc(this.centerX, this.centerY, this.radius, startAngle, endAngle);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Borda da fatia
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = lineWidth;
        this.ctx.beginPath();
        this.ctx.moveTo(this.centerX, this.centerY);
        this.ctx.arc(this.centerX, this.centerY, this.radius, startAngle, endAngle);
        this.ctx.closePath();
        this.ctx.stroke();
        
        // Limpa sombra
        this.ctx.shadowBlur = 0;
        
        // Desenha label da nota
        this.drawSliceLabel(index, startAngle, endAngle);
    }

    /**
     * Desenha label da nota em uma fatia
     * @param {number} index - Índice da fatia
     * @param {number} startAngle - Ângulo inicial
     * @param {number} endAngle - Ângulo final
     */
    drawSliceLabel(index, startAngle, endAngle) {
        const noteName = this.audioManager.getNoteName(index);
        const midAngle = (startAngle + endAngle) / 2;
        
        // Posição do label (2/3 do raio)
        const labelRadius = this.radius * 0.65;
        const x = this.centerX + labelRadius * Math.cos(midAngle);
        const y = this.centerY + labelRadius * Math.sin(midAngle);
        
        // Desenha texto
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // Shadow para melhor legibilidade
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        this.ctx.shadowBlur = 4;
        this.ctx.shadowOffsetX = 1;
        this.ctx.shadowOffsetY = 1;
        
        this.ctx.fillText(noteName, x, y);
        
        // Limpa shadow
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
    }

    /**
     * Desenha círculo central
     */
    drawCenterCircle() {
        // Gradiente do círculo
        const gradient = this.ctx.createRadialGradient(
            this.centerX, this.centerY, 0,
            this.centerX, this.centerY, this.innerRadius
        );
        gradient.addColorStop(0, '#1a1f3a');
        gradient.addColorStop(1, '#0a0e27');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, this.innerRadius, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // Borda
        this.ctx.strokeStyle = '#00a8ff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, this.innerRadius, 0, 2 * Math.PI);
        this.ctx.stroke();
    }

    /**
     * Desenha borda do círculo
     */
    drawBorder() {
        this.ctx.strokeStyle = '#00a8ff';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, this.radius, 0, 2 * Math.PI);
        this.ctx.stroke();
    }

    /**
     * Determina qual fatia está sendo focada baseado em coordenadas
     * @param {number} x - Coordenada X
     * @param {number} y - Coordenada Y
     * @returns {number} Índice da fatia ou -1
     */
    getSliceAtPosition(x, y) {
        // Calcula distância do centro
        const dx = x - this.centerX;
        const dy = y - this.centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Se fora do raio externo ou dentro do raio interno, nenhuma fatia
        if (distance < this.innerRadius || distance > this.radius) {
            return -1;
        }
        
        // Calcula ângulo
        let angle = Math.atan2(dy, dx) + Math.PI / 2;
        if (angle < 0) angle += 2 * Math.PI;
        
        // Determina qual fatia
        const angleSlice = (2 * Math.PI) / this.slices;
        const sliceIndex = Math.floor(angle / angleSlice);
        
        return Math.min(sliceIndex, this.slices - 1);
    }

    /**
     * Atualiza foco baseado em coordenadas de gaze
     * @param {number} gazeX - Coordenada X do gaze
     * @param {number} gazeY - Coordenada Y do gaze
     */
    updateFocus(gazeX, gazeY) {
        const slice = this.getSliceAtPosition(gazeX, gazeY);
        
        if (slice !== this.focusedSlice) {
            this.focusedSlice = slice;
            
            if (slice >= 0) {
                const noteName = this.audioManager.getNoteName(slice);
                this.callbacks.onSliceHover(slice, noteName);
            }
            
            this.draw();
        }
    }

    /**
     * Seleciona uma fatia (simula clique)
     * @param {number} sliceIndex - Índice da fatia
     */
    selectSlice(sliceIndex) {
        if (sliceIndex >= 0 && sliceIndex < this.slices) {
            this.selectedSlice = sliceIndex;
            
            const noteName = this.audioManager.getNoteName(sliceIndex);
            console.log(`🎵 Tocando ${noteName}`);
            
            // Toca a nota
            this.audioManager.playNote(sliceIndex, 0.5);
            
            // Callback
            this.callbacks.onSliceClick(sliceIndex, noteName);
            
            // Desenha
            this.draw();
            
            // Limpa seleção após animação
            setTimeout(() => {
                this.selectedSlice = -1;
                this.draw();
            }, 200);
        }
    }

    /**
     * Mouse move handler (para testes)
     * @param {MouseEvent} e
     */
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.updateFocus(x, y);
    }

    /**
     * Click handler (para testes)
     * @param {MouseEvent} e
     */
    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const sliceIndex = this.getSliceAtPosition(x, y);
        this.selectSlice(sliceIndex);
    }

    /**
     * Define callback para hover
     * @param {Function} callback
     */
    setOnSliceHover(callback) {
        this.callbacks.onSliceHover = callback;
    }

    /**
     * Define callback para clique
     * @param {Function} callback
     */
    setOnSliceClick(callback) {
        this.callbacks.onSliceClick = callback;
    }

    /**
     * Obtém índice da fatia focada
     * @returns {number}
     */
    getFocusedSlice() {
        return this.focusedSlice;
    }

    /**
     * Limpa o foco
     */
    clearFocus() {
        this.focusedSlice = -1;
        this.draw();
    }
}

// Exporta para uso global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PizzaCircle;
}
