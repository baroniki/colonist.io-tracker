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
    let tracker_element_container = document.createElement('div')
    tracker_element_container.id = 'tracker-container'
    tracker_element_container.innerHTML = 'Cards'

    get_players()

    document.querySelector('body').appendChild(tracker_element_container)

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