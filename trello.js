// https://developer.atlassian.com/cloud/trello/rest/api-group-boards/#api-boards-post

module.exports = (tools) => {
	return () => {

		const fetch = require('node-fetch')

		const key = tools.config.trello.key
		const token = tools.config.trello.token

		const sourceBoardUrlId = tools.config.trello.sourceBoard

		function createBoard(boardName) {

			let newBoardName = boardName || 'Новая доска'

			let createBoardUrl = new URL('https://api.trello.com/1/boards/?')
			createBoardUrl.searchParams.append('key', key)
			createBoardUrl.searchParams.append('token', token)
			createBoardUrl.searchParams.append('name', newBoardName)
			createBoardUrl.searchParams.append('prefs_background', 'grey')
			createBoardUrl.searchParams.append('prefs_selfJoin', false)

			restGetBoardId( sourceBoardUrlId, boardId => {

				createBoardUrl.searchParams.append('idBoardSource', boardId)

				restCreateBoard(createBoardUrl)
			})
		}

		function restCreateBoard(url) {
			fetch(url.href, {
					method: 'POST',
				})
				.then(response => {
					console.log(
						`Response: ${response.status} ${response.statusText}`
					)
					console.log(
						response.url
					)
					return response.text()
				})
				.then(text => {
					let json = JSON.parse(text)
					let url = json.url
					console.log(
						'Trello board',
						tools.color.file(url),
						'is created',
					)
				})
				.catch(err => console.error(err))
		}

		createBoard( tools.config.project.name )



		function restGetBoardId(boardUrlId, callback) {

			fetch(`https://api.trello.com/1/boards/${boardUrlId}?key=${key}&token=${token}`, {
					method: 'GET',
					headers: {
						'Accept': 'application/json'
					}
				})
				.then(response => {
					console.log(
						`Getting the source board ID`
					)
					console.log(
						`Response: ${response.status} ${response.statusText}`
					)
					return response.text();
				})
				.then(text => {
					let responseObj = JSON.parse(text)
					// console.log(responseObj.name)
					// console.log(responseObj.id)
					callback(responseObj.id)
				})
				.catch(err => console.error(err))
		}

	}
}
