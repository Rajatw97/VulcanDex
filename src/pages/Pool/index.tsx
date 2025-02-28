import React, {useContext, useMemo} from 'react'
import styled, {ThemeContext} from 'styled-components'
import {Pair, JSBI} from '@uniswap/sdk'
import {Link} from 'react-router-dom'
import {SwapPoolTabs} from '../../components/NavigationTabs'

import FullPositionCard from '../../components/PositionCard'
import {useUserHasLiquidityInAllTokens} from '../../data/V1'
import {useTokenBalancesWithLoadingIndicator} from '../../state/wallet/hooks'
// import { StyledInternalLink, ExternalLink, TYPE, HideSmall } from '../../theme'
import {StyledInternalLink, TYPE, HideSmall} from '../../theme'
import {Text} from 'rebass'
import Card from '../../components/Card'
import {RowBetween, RowFixed} from '../../components/Row'
import {ButtonPrimary} from '../../components/Button'
import {AutoColumn} from '../../components/Column'

import {useActiveWeb3React} from '../../hooks'
import {usePairs} from '../../data/Reserves'
import {toV2LiquidityToken, useTrackedTokenPairs} from '../../state/user/hooks'
import {Dots} from '../../components/swap/styleds'
import {CardSection, DataCard, CardNoise, CardBGImage} from '../../components/earn/styled'
import {useStakingInfo} from '../../state/stake/hooks'
import {BIG_INT_ZERO} from '../../constants'

const PageWrapper = styled(AutoColumn)`
  max-width: 640px;
  width: 100%;
`

const VoteCard = styled(DataCard)`
  background: radial-gradient(76.02% 75.41% at 1.84% 0%, #27ae60 0%, #000000 100%);
  overflow: hidden;
`

const TitleRow = styled(RowBetween)`
  ${({theme}) => theme.mediaWidth.upToSmall`
    flex-wrap: wrap;
    gap: 12px;
    width: 100%;
    flex-direction: column-reverse;
  `};
`

const ButtonRow = styled(RowFixed)`
  gap: 8px;
  ${({theme}) => theme.mediaWidth.upToSmall`
    width: 100%;
  `};
`

const ResponsiveButtonPrimary = styled(ButtonPrimary)`
  width: fit-content;
  ${({theme}) => theme.mediaWidth.upToSmall`
    width: 48%;
  `};
`

/*const ResponsiveButtonSecondary = styled(ButtonSecondary)`
  width: fit-content;
  ${({theme}) => theme.mediaWidth.upToSmall`
    width: 48%;
  `};
`*/

const EmptyProposals = styled.div`
  border: 1px solid ${({theme}) => theme.text4};
  padding: 16px 12px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`

export default function Pool() {
    const theme = useContext(ThemeContext)
    const {account} = useActiveWeb3React()

    // fetch the user's balances of all tracked V2 LP tokens
    const trackedTokenPairs = useTrackedTokenPairs()
    const tokenPairsWithLiquidityTokens = useMemo(
        () => trackedTokenPairs.map(tokens => ({liquidityToken: toV2LiquidityToken(tokens), tokens})),
        [trackedTokenPairs]
    )
    const liquidityTokens = useMemo(() => tokenPairsWithLiquidityTokens.map(tpwlt => tpwlt.liquidityToken), [
        tokenPairsWithLiquidityTokens
    ])
    const [v2PairsBalances, fetchingV2PairBalances] = useTokenBalancesWithLoadingIndicator(
        account ?? undefined,
        liquidityTokens
    )

    // fetch the reserves for all V2 pools in which the user has a balance
    const liquidityTokensWithBalances = useMemo(
        () =>
            tokenPairsWithLiquidityTokens.filter(({liquidityToken}) =>
                v2PairsBalances[liquidityToken.address]?.greaterThan('0')
            ),
        [tokenPairsWithLiquidityTokens, v2PairsBalances]
    )

    const v2Pairs = usePairs(liquidityTokensWithBalances.map(({tokens}) => tokens))
    const v2IsLoading =
        fetchingV2PairBalances || v2Pairs?.length < liquidityTokensWithBalances.length || v2Pairs?.some(V2Pair => !V2Pair)

    const allV2PairsWithLiquidity = v2Pairs.map(([, pair]) => pair).filter((v2Pair): v2Pair is Pair => Boolean(v2Pair))

    const hasV1Liquidity = useUserHasLiquidityInAllTokens()

    // show liquidity even if its deposited in rewards contract
    const stakingInfo = useStakingInfo()
    const stakingInfosWithBalance = stakingInfo?.filter(pool => JSBI.greaterThan(pool.stakedAmount.raw, BIG_INT_ZERO))
    const stakingPairs = usePairs(stakingInfosWithBalance?.map(stakingInfo => stakingInfo.tokens))

    // remove any pairs that also are included in pairs with stake in mining pool
    const v2PairsWithoutStakedAmount = allV2PairsWithLiquidity.filter(v2Pair => {
        return (
            stakingPairs
                ?.map(stakingPair => stakingPair[1])
                .filter(stakingPair => stakingPair?.liquidityToken.address === v2Pair.liquidityToken.address).length === 0
        )
    })

    return (
        <>
            <div className="container-fluid h-100">
                <div className="row justify-content-center align-items-center h-100">
                    <div className="col-11 col-sm-9 col-md-8 col-lg-7 col-xl-6 col-xxl-4 my-4">
                        <PageWrapper className="pb-5 mb-3">
                            <SwapPoolTabs active={'pool'}/>
                            <VoteCard>
                                <CardBGImage/>
                                <CardNoise/>
                                <CardSection className="p-4">
                                    <AutoColumn gap="md">
                                        <RowBetween>
                                            <h5 className="OrangeColor">Fees Explained</h5>
                                        </RowBetween>
                                        <RowBetween>
                                            <TYPE.white fontSize={14}>
                                                {`Liquidity providers earn a 0.2% fee on all trades proportional to their share of the pool. 0.1% is sent to support the growth of the project. Fees are added to the pool, accrue in real time and can be claimed by withdrawing your liquidity.`}
                                            </TYPE.white>
                                        </RowBetween>
                                        {/* <ExternalLink
                style={{ color: 'white', textDecoration: 'underline' }}
                target="_blank"
                href="https://uniswap.org/docs/v2/core-concepts/pools/"
              >
                <TYPE.white fontSize={14}>Read more about providing liquidity</TYPE.white>
              </ExternalLink> */}
                                    </AutoColumn>
                                </CardSection>
                                <CardBGImage/>
                                <CardNoise/>
                            </VoteCard>

                            <AutoColumn gap="lg" justify="center">
                                <AutoColumn gap="lg" style={{width: '100%'}}>
                                    <TitleRow style={{marginTop: '1rem'}} padding={'0'}>
                                        <HideSmall>
                                            <h5 className="text-white mb-0">
                                                Your liquidity
                                            </h5>
                                        </HideSmall>
                                        <ButtonRow>
                                            {/*<ResponsiveButtonSecondary as={Link} className="btn BtnBorderOrange shadow-none px-4 py-2" to="/create/ETH">
                                                Create a pair
                                            </ResponsiveButtonSecondary>*/}
                                            <ResponsiveButtonPrimary
                                                id="join-pool-button"
                                                as={Link}
                                                className="btn BtnOrange shadow-none px-4 py-2"
                                                to="/add/ETH"
                                            >
                                                Add Liquidity
                                            </ResponsiveButtonPrimary>
                                        </ButtonRow>
                                    </TitleRow>

                                    {!account ? (
                                        <Card padding="40px">
                                            <TYPE.body color={theme.text3} textAlign="center">
                                                Connect to a wallet to view your liquidity.
                                            </TYPE.body>
                                        </Card>
                                    ) : v2IsLoading ? (
                                        <EmptyProposals>
                                            <TYPE.body color={theme.text3} textAlign="center">
                                                <Dots>Loading</Dots>
                                            </TYPE.body>
                                        </EmptyProposals>
                                    ) : allV2PairsWithLiquidity?.length > 0 || stakingPairs?.length > 0 ? (
                                        <>
                                            {/* <ButtonSecondary>
                  <RowBetween>
                    <ExternalLink href={'https://uniswap.info/account/' + account}>
                      Account analytics and accrued fees
                    </ExternalLink>
                    <span> ↗</span>
                  </RowBetween>
                </ButtonSecondary> */}
                                            {v2PairsWithoutStakedAmount.map(v2Pair => (
                                                <FullPositionCard key={v2Pair.liquidityToken.address} pair={v2Pair}/>
                                            ))}
                                            {stakingPairs.map(
                                                (stakingPair, i) =>
                                                    stakingPair[1] && ( // skip pairs that arent loaded
                                                        <FullPositionCard
                                                            key={stakingInfosWithBalance[i].stakingRewardAddress}
                                                            pair={stakingPair[1]}
                                                            stakedBalance={stakingInfosWithBalance[i].stakedAmount}
                                                        />
                                                    )
                                            )}
                                        </>
                                    ) : (
                                        <EmptyProposals>
                                            <TYPE.body color={theme.text3} textAlign="center">
                                                No liquidity found.
                                            </TYPE.body>
                                        </EmptyProposals>
                                    )}

                                    <AutoColumn justify={'center'} gap="md">
                                        <Text textAlign="center" fontSize={14} style={{padding: '.5rem 0 .5rem 0'}}>
                                            {hasV1Liquidity ? 'Uniswap V1 liquidity found!' : "Don't see a pool you joined?"}{' '}
                                            <StyledInternalLink id="import-pool-link"
                                                                to={hasV1Liquidity ? '/migrate/v1' : '/find'}>
                                                {hasV1Liquidity ? 'Migrate now.' : 'Import it.'}
                                            </StyledInternalLink>
                                        </Text>
                                    </AutoColumn>
                                </AutoColumn>
                            </AutoColumn>
                        </PageWrapper>
                    </div>
                </div>
            </div>
        </>
    )
}
