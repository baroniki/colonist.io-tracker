console.log('extension running')

class CardCount {
    constructor() {
        this.wood = 0
        this.brick = 0
        this.sheep = 0
        this.wheat = 0
        this.ore = 0
    }

    update_cards(card_update) {
        this.wood += card_update.wood
        this.brick += card_update.brick
        this.sheep += card_update.sheep
        this.wheat += card_update.wheat
        this.ore += card_update.ore
    }
}

let chat_log
let player_chat_index = 0
let card_chat_index = 0
let in_game = false
setInterval(function() { check_in_game() }, 3000)

let tracker_data = []

function create_tracker() {
    get_players()
    track_cards()
}

function get_players() {
    const config = { attributes: true, childList: true, subtree: true }

    const placement_observer = new MutationObserver(get_player_names)
    placement_observer.observe(chat_log, config)
}

function track_cards() {
    const config = { attributes: true, childList: true, subtree: true }

    const card_observer = new MutationObserver(update_tracker)
    card_observer.observe(chat_log, config)
}

function update_tracker() {
    console.log('in update_tracker')
    let chat_log_message = chat_log.children[card_chat_index]
    while(chat_log_message) {
        const update = get_card_update(chat_log_message)

        if(update.card_update.is) {
            update_player(update.card_update.player, update.card_update.cards)
        }

        chat_log_message = chat_log.children[++card_chat_index]
    }

    updateUI()
    console.log(tracker_data)
}

function update_player(player_name, cards) {
    for(let player of tracker_data) {
        if(player.name === player_name)
            player.cards.update_cards(cards)
    }
}

function get_card_update(message) {
    let update = {
        card_update: {
            is: false,
            player: '',
            cards: new CardCount()
        },
        trade_update: {
            is: false,
            player_give: '',
            player_get: '',
            cards: new CardCount()
        },
        robber_update: {
            is: false
        }
    }

    const roll_update = message.innerText.match(/ got:/)
    if(roll_update) {
        update.card_update.is = true
        update.card_update.player = message.innerText.substring(0, roll_update.index)
        
        // find which cards the player got
        for(const child of message.childNodes) {
            switch(child.alt) {
                case 'lumber':
                    update.card_update.cards.wood++
                    break
                case 'brick':
                    update.card_update.cards.brick++
                    break
                case 'wool':
                    update.card_update.cards.sheep++
                    break
                case 'grain':
                    update.card_update.cards.wheat++
                    break
                case 'ore':
                    update.card_update.cards.ore++
                    break
            }
        }

        return update
    }

    const discard_update = message.innerText.match(/ discarded:/)
    if(discard_update) {
        update.card_update.is = true
        update.card_update.player = message.innerText.substring(0, discard_update.index)
        
        // find which cards the player got
        for(const child of message.childNodes) {
            switch(child.alt) {
                case 'lumber':
                    update.card_update.cards.wood--
                    break
                case 'brick':
                    update.card_update.cards.brick--
                    break
                case 'wool':
                    update.card_update.cards.sheep--
                    break
                case 'grain':
                    update.card_update.cards.wheat--
                    break
                case 'ore':
                    update.card_update.cards.ore--
                    break
            }
        }

        return update
    }

    const build_update = message.innerText.match(/ built a/)
    if(build_update) {
        update.card_update.is = true
        update.card_update.player = message.innerText.substring(0, build_update.index)

        //  check what the player built
        switch(message.childNodes[2].alt) {
            case 'road':
                update.card_update.cards.wood = -1
                update.card_update.cards.brick = -1
                break
            case 'settlement':
                update.card_update.cards.wood = -1
                update.card_update.cards.brick = -1
                update.card_update.cards.sheep = -1
                update.card_update.cards.wheat = -1
            case 'city':
                update.card_update.cards.wheat = -2
                update.card_update.cards.ore = -3
        }

        return update
    }

    const dev_card_update = message.innerText.match(/ bought/)
    if(dev_card_update) {
        update.card_update.is = true
        update.card_update.player = message.innerText.substring(0, dev_card_update.index)

        update.card_update.cards.sheep = -1
        update.card_update.cards.wheat = -1
        update.card_update.cards.ore = -1

        return update
    }

    return update
}

function get_player_names() {
    let chat_log_message = chat_log.children[player_chat_index]
    while(chat_log_message) {
        const match = chat_log_message.innerText.match(/ turn to place/)
        if(match) {
            let player_name = chat_log_message.innerText.substring(0, match.index)
            
            if(!player_already_created(player_name))
                add_player(player_name)
        }
            
        chat_log_message = chat_log.children[++player_chat_index]
    }
}

function player_already_created(player_name) {
    for(let player of tracker_data) {
        if(player.name === player_name)
            return true
    }
    return false
}

function add_player(player_name) {
    let new_player = {
        name: player_name,
        cards: new CardCount()
    }

    tracker_data.push(new_player)
}

function check_in_game() {
    chat_log = document.querySelector("#game-log-text")
    if(!in_game && chat_log) {
        in_game = true
        create_tracker()
    }
}

// ui stuff

function updateUI() {
    if(document.querySelector('.tracker-container'))
        document.querySelector('.tracker-container').remove()

    const ui_container = document.createElement('div')
    ui_container.className = 'tracker-container'

    const ui_move = document.createElement('div')
    ui_move.className = 'move'
    ui_move.addEventListener('dblclick', toggle_info)
    

    const ui_header = document.createElement('div')
    ui_header.className = 'tracker-header'
    ui_header.innerText = 'Card Tracker'

    const ui_howto = document.createElement('div')
    ui_howto.className = 'howto'
    ui_howto.innerText = 'Drag top to move, double click to hide/show'

    ui_container.appendChild(ui_move)
    ui_container.appendChild(ui_header)
    ui_container.appendChild(ui_howto)

    const ui_info_container = document.createElement('div')
    ui_info_container.id = 'info-container'
    
    let ui_card_count

    for(const player of tracker_data) {
        console.log(player)
        const ui_player_name = document.createElement('div')
        ui_player_name.className = 'player-name'
        ui_player_name.innerText = player.name

        const ui_player_info = document.createElement('div')
        ui_player_info.className = 'player-info'

        const ui_wood_card = document.createElement('img')
        ui_wood_card.className = 'lobby-chat-text-icon'
        ui_wood_card.src = '../dist/images/card_lumber.svg?v87.1'
        ui_wood_card.alt = 'lumber'
        ui_wood_card.height = 20
        ui_wood_card.width = 14.25

        const ui_brick_card = document.createElement('img')
        ui_brick_card.className = 'lobby-chat-text-icon'
        ui_brick_card.src = '../dist/images/card_brick.svg?v87.1'
        ui_brick_card.alt = 'brick'
        ui_brick_card.height = 20
        ui_brick_card.width = 14.25

        const ui_sheep_card = document.createElement('img')
        ui_sheep_card.className = 'lobby-chat-text-icon'
        ui_sheep_card.src = '../dist/images/card_wool.svg?v87.1'
        ui_sheep_card.alt = 'wool'
        ui_sheep_card.height = 20
        ui_sheep_card.width = 14.25

        const ui_wheat_card = document.createElement('img')
        ui_wheat_card.className = 'lobby-chat-text-icon'
        ui_wheat_card.src = '../dist/images/card_grain.svg?v87.1'
        ui_wheat_card.alt = 'grain'
        ui_wheat_card.height = 20
        ui_wheat_card.width = 14.25

        const ui_ore_card = document.createElement('img')
        ui_ore_card.className = 'lobby-chat-text-icon'
        ui_ore_card.src = '../dist/images/card_ore.svg?v87.1'
        ui_ore_card.alt = 'ore'
        ui_ore_card.height = 20
        ui_ore_card.width = 14.25

        ui_card_count = document.createElement('span')
        ui_card_count.className = 'card-count'
        ui_card_count.innerText = ': ' + player.cards.wood

        ui_player_info.appendChild(ui_wood_card)
        ui_player_info.appendChild(ui_card_count)

        ui_card_count = document.createElement('span')
        ui_card_count.className = 'card-count'
        ui_card_count.innerText = ': ' + player.cards.brick

        ui_player_info.appendChild(ui_brick_card)
        ui_player_info.appendChild(ui_card_count)

        ui_card_count = document.createElement('span')
        ui_card_count.className = 'card-count'
        ui_card_count.innerText = ': ' + player.cards.sheep

        ui_player_info.appendChild(ui_sheep_card)
        ui_player_info.appendChild(ui_card_count)

        ui_card_count = document.createElement('span')
        ui_card_count.className = 'card-count'
        ui_card_count.innerText = ': ' + player.cards.wheat

        ui_player_info.appendChild(ui_wheat_card)
        ui_player_info.appendChild(ui_card_count)

        ui_card_count = document.createElement('span')
        ui_card_count.className = 'card-count'
        ui_card_count.innerText = ': ' + player.cards.ore

        ui_player_info.appendChild(ui_ore_card)
        ui_player_info.appendChild(ui_card_count)


        ui_info_container.appendChild(ui_player_name)
        ui_info_container.appendChild(ui_player_info)
    }

    ui_container.appendChild(ui_info_container)

    document.querySelector('body').appendChild(ui_container)

    dragElement(ui_container)
    
}

function toggle_info() {
    const info = document.querySelector('#info-container')
    if(info.style.display === 'block') {
        info.style.display = 'none'
        document.querySelector('.tracker-container').style.height = 'auto'
    }
    else {
        info.style.display = 'block'
    }
}

function dragElement(elmnt) {
    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    document.querySelector(".move").onmousedown = dragMouseDown;
  
    function dragMouseDown(e) {
      e = e || window.event;
      e.preventDefault();
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      document.onmousemove = elementDrag;
    }
  
    function elementDrag(e) {
      e = e || window.event;
      e.preventDefault();
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
      elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    }
  
    function closeDragElement() {
      document.onmouseup = null;
      document.onmousemove = null;
    }
  }